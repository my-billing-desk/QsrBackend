const { Op } = require('sequelize');
const { Order, Purchase, PurchaseReturn, Expense, Withdrawal, CashTopUp, sequelize } = require('../models');

exports.getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('P&L Request:', { startDate, endDate, tenantId: req.tenantId });

        // Use string dates for SQLite compatibility
        const endStr = endDate || new Date().toISOString().split('T')[0];
        const startStr = startDate || new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().split('T')[0];
        console.log('P&L Date Range:', { startStr, endStr });

        // 1. Fetch Revenue (Orders) - Group by Source
        const orders = await Order.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')), 'month'],
                'source',
                [sequelize.literal('SUM(totalAmount - IFNULL(taxAmount, 0))'), 'total']
            ],
            where: {
                status: { [Op.not]: 'cancelled' },
                createdAt: {
                    [Op.gte]: startStr + ' 00:00:00',
                    [Op.lte]: endStr + ' 23:59:59'
                },
                tenantId: req.tenantId
            },
            group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')), 'source']
        });
        console.log('Fetched Orders:', JSON.stringify(orders, null, 2));

        // 2. Fetch Purchases (Inventory)
        const purchases = await Purchase.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('invoiceDate')), 'month'],
                [sequelize.fn('sum', sequelize.col('grandTotal')), 'total']
            ],
            where: {
                invoiceDate: {
                    [Op.gte]: startStr,
                    [Op.lte]: endStr
                },
                tenantId: req.tenantId
            },
            group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('invoiceDate'))]
        });

        // 3. Fetch Purchase Returns
        const purchaseReturns = await PurchaseReturn.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('sum', sequelize.col('grandTotal')), 'total']
            ],
            where: {
                createdAt: {
                    [Op.gte]: startStr + ' 00:00:00',
                    [Op.lte]: endStr + ' 23:59:59'
                },
                tenantId: req.tenantId
            },
            group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt'))]
        });

        // 4. Fetch Expenses (Operating) - Group by Reason
        const expenses = await Expense.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('date')), 'month'],
                'reason',
                [sequelize.fn('sum', sequelize.col('amount')), 'total']
            ],
            where: {
                date: {
                    [Op.gte]: startStr,
                    [Op.lte]: endStr
                },
                tenantId: req.tenantId
            },
            group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('date')), 'reason']
        });

        // 5. Fetch Withdrawals
        const withdrawals = await Withdrawal.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('date')), 'month'],
                [sequelize.fn('sum', sequelize.col('amount')), 'total']
            ],
            where: {
                date: {
                    [Op.gte]: startStr,
                    [Op.lte]: endStr
                },
                tenantId: req.tenantId
            },
            group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('date'))]
        });

        // 6. Fetch Cash Top-Ups
        const cashTopUps = await CashTopUp.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('date')), 'month'],
                [sequelize.fn('sum', sequelize.col('amount')), 'total']
            ],
            where: {
                date: {
                    [Op.gte]: startStr,
                    [Op.lte]: endStr
                },
                tenantId: req.tenantId
            },
            group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('date'))]
        });

        // Process Data
        const reportMap = {};

        // Define known online sources to group them
        const knownOnlineSources = ['Zomato', 'Swiggy', 'UberEats', 'Call center', 'Uengage', 'Jungle Works', 'Thrive', 'Menu QR Code', 'Dineout Ordering'];

        // Initialize all months in range
        let curr = new Date(startStr);
        const end = new Date(endStr);
        while (curr <= end) {
            const m = curr.toISOString().slice(0, 7);
            if (!reportMap[m]) {
                const sources = {};
                knownOnlineSources.forEach(s => sources[s] = 0);

                reportMap[m] = {
                    month: m,
                    revenue: {
                        total: 0,
                        onlineIntegratedStore: {
                            total: 0,
                            sources: sources
                        },
                        other: 0
                    },
                    commissions: { total: 0 },
                    cogs: { total: 0, purchases: 0, purchaseReturns: 0 },
                    grossCashProfit: 0,
                    operatingCost: {
                        total: 0,
                        groups: {
                            'Labor Costs': { total: 0, items: {} },
                            'Food and Beverage': { total: 0, items: {} },
                            'Expenses & Withdrawal': { total: 0, items: {} },
                            'Rent and Utilities': { total: 0, items: {} },
                            'Maintenance and Repairs': { total: 0, items: {} },
                            'Delivery and Transportation': { total: 0, items: {} },
                            'Interest/Loan related expenses': { total: 0, items: {} },
                            'Consumables': { total: 0, items: {} },
                            'Miscellaneous': { total: 0, items: {} }
                        }
                    },
                    netCashProfit: 0
                };
            }
            curr.setMonth(curr.getMonth() + 1);
        }

        // 1. Process Revenue & Commissions
        const commissionRates = {
            'Zomato': 0.25,
            'Swiggy': 0.25,
            'ONDC': 0.05,
            'UberEats': 0.20,
            'POS': 0,
            'Menu QR Code': 0,
            'Dineout Ordering': 0.10
        };

        orders.forEach(o => {
            const m = o.get('month');
            const sourceRaw = (o.get('source') || 'POS').trim();
            const val = parseFloat(o.get('total') || 0);

            if (!reportMap[m]) return;

            reportMap[m].revenue.total += val;

            // Calculate Commission
            const rate = commissionRates[sourceRaw] || (knownOnlineSources.includes(sourceRaw) ? 0.20 : 0);
            const comm = val * rate;
            reportMap[m].commissions.total += comm;

            // Case-insensitive match for online sources
            const matchedSource = knownOnlineSources.find(s => s.toLowerCase() === sourceRaw.toLowerCase());

            if (matchedSource) {
                reportMap[m].revenue.onlineIntegratedStore.sources[matchedSource] = (reportMap[m].revenue.onlineIntegratedStore.sources[matchedSource] || 0) + val;
                reportMap[m].revenue.onlineIntegratedStore.total += val;
            } else {
                reportMap[m].revenue.other += val;
            }
        });

        // 2. Process COGS
        purchases.forEach(p => {
            const m = p.get('month');
            const val = parseFloat(p.get('total') || 0);
            if (!reportMap[m]) return;
            reportMap[m].cogs.purchases += val;
            reportMap[m].cogs.total += val;

            // Also add to Food and Beverage in Operating Cost as per UI screenshot
            reportMap[m].operatingCost.groups['Food and Beverage'].total += val;
            reportMap[m].operatingCost.groups['Food and Beverage'].items['Ingredients and Raw Materials (grocery, dairy products, fruits & vegs)'] =
                (reportMap[m].operatingCost.groups['Food and Beverage'].items['Ingredients and Raw Materials (grocery, dairy products, fruits & vegs)'] || 0) + val;
            reportMap[m].operatingCost.total += val;
        });

        purchaseReturns.forEach(pr => {
            const m = pr.get('month');
            const val = parseFloat(pr.get('total') || 0);
            if (!reportMap[m]) return;
            reportMap[m].cogs.purchaseReturns += val;
            reportMap[m].cogs.total -= val;
        });

        // 3. Process Expenses & Withdrawals
        const groupMapping = {
            'Labor Costs': ['Salary', 'Wages', 'Staff'],
            'Food and Beverage': ['Raw Material', 'Grocery', 'Dairy', 'Fruits', 'Vegs', 'Food', 'Beverage', 'Ingredients'],
            'Rent and Utilities': ['Rent', 'Lease', 'Gas', 'Electricity', 'Water', 'Internet', 'Utility', 'Power'],
            'Maintenance and Repairs': ['Maintenance', 'Repair', 'Equipment'],
            'Delivery and Transportation': ['Fuel', 'Delivery', 'Transport', 'Vehicle'],
            'Interest/Loan related expenses': ['Loan', 'Interest', 'Bank Fee', 'EMI'],
            'Consumables': ['Supplies', 'Cleaning', 'Packaging', 'Consumables'],
            'Miscellaneous': ['Misc', 'Other']
        };

        const normalizeItemName = (reason) => {
            const lower = reason.toLowerCase();
            if (lower.includes('rent') || lower.includes('lease')) return 'Rent or Lease';
            if (lower.includes('gas')) return 'Gas';
            if (lower.includes('electricity') || lower.includes('power')) return 'Electricity';
            if (lower.includes('water')) return 'Water';
            if (lower.includes('salary') || lower.includes('wages')) return 'Salaries and Wages';
            if (lower.includes('raw material') || lower.includes('grocery') || lower.includes('dairy') || lower.includes('food') || lower.includes('beverage') || lower.includes('ingredient'))
                return 'Ingredients and Raw Materials (grocery, dairy products, fruits & vegs)';
            if (lower.includes('maintenance')) return 'Equipment Maintenance';
            return reason;
        };

        const getGroup = (reason) => {
            for (const [group, keywords] of Object.entries(groupMapping)) {
                if (keywords.some(k => reason.toLowerCase().includes(k.toLowerCase()))) {
                    return group;
                }
            }
            return 'Miscellaneous';
        };

        expenses.forEach(e => {
            const m = e.get('month');
            const reason = e.get('reason') || 'Other';
            const val = parseFloat(e.get('total') || 0);
            if (!reportMap[m]) return;

            const group = getGroup(reason);
            const normalizedName = normalizeItemName(reason);

            if (group === 'Miscellaneous' || group === 'Expenses & Withdrawal') {
                const targetGroup = 'Expenses & Withdrawal';
                const itemName = reason.toLowerCase().includes('petty') ? 'Petty Cash' : 'Expenses';
                reportMap[m].operatingCost.groups[targetGroup].items[itemName] = (reportMap[m].operatingCost.groups[targetGroup].items[itemName] || 0) + val;
                reportMap[m].operatingCost.groups[targetGroup].total += val;
            } else {
                reportMap[m].operatingCost.groups[group].items[normalizedName] = (reportMap[m].operatingCost.groups[group].items[normalizedName] || 0) + val;
                reportMap[m].operatingCost.groups[group].total += val;
            }

            reportMap[m].operatingCost.total += val;
        });

        withdrawals.forEach(w => {
            const m = w.get('month');
            const val = parseFloat(w.get('total') || 0);
            if (!reportMap[m]) return;

            const targetGroup = 'Expenses & Withdrawal';
            reportMap[m].operatingCost.groups[targetGroup].items['Withdrawal'] = (reportMap[m].operatingCost.groups[targetGroup].items['Withdrawal'] || 0) + val;
            reportMap[m].operatingCost.groups[targetGroup].total += val;
            reportMap[m].operatingCost.total += val;
        });

        // 5. Process Cash Top-Ups (Other Income)
        cashTopUps.forEach(ct => {
            const m = ct.get('month');
            const val = parseFloat(ct.get('total') || 0);
            if (!reportMap[m]) return;

            reportMap[m].revenue.other += val;
            reportMap[m].revenue.total += val;
        });

        // 6. Final Calculations
        Object.values(reportMap).forEach(item => {
            item.grossCashProfit = item.revenue.total - item.commissions.total - item.cogs.total;
            item.netCashProfit = item.grossCashProfit - item.operatingCost.total;
        });

        const report = Object.values(reportMap).sort((a, b) => b.month.localeCompare(a.month));
        res.json({ success: true, data: report });

    } catch (error) {
        console.error('Error fetching P&L:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Profit & Loss report' });
    }
};
