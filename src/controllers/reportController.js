const { Op } = require('sequelize');
const { Order, Purchase, sequelize } = require('../models');

exports.getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Default to last 6 months if not provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(end.getMonth() - 5));

        // 1. Fetch Revenue (Orders) broken down by Source and Type
        // Group by Month, Source, Type
        const orders = await Order.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')), 'month'],
                'source',
                'type',
                [sequelize.fn('sum', sequelize.col('totalAmount')), 'revenue']
            ],
            where: {
                status: { [Op.not]: 'cancelled' },
                createdAt: {
                    [Op.between]: [start, end]
                },
                tenantId: req.tenantId
            },
            group: [
                sequelize.fn('strftime', '%Y-%m', sequelize.col('createdAt')),
                'source',
                'type'
            ],
            order: [[sequelize.col('month'), 'DESC']]
        });

        // 2. Fetch Cost (Purchases) - (Simplistic for now, just total)
        const purchases = await Purchase.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m', sequelize.col('invoiceDate')), 'month'],
                [sequelize.fn('sum', sequelize.col('grandTotal')), 'cost']
            ],
            where: {
                invoiceDate: {
                    [Op.between]: [start, end]
                },
                tenantId: req.tenantId
            },
            group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('invoiceDate'))],
            order: [[sequelize.col('month'), 'DESC']]
        });

        // 3. Process Data
        const reportMap = {};

        const initMonth = (m) => {
            if (!reportMap[m]) {
                reportMap[m] = {
                    month: m,
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                    breakdown: {
                        online: {
                            total: 0,
                            sources: {} // Zomato: 0, Swiggy: 0
                        },
                        offline: {
                            total: 0,
                            types: {} // dine-in: 0, takeaway: 0
                        }
                    }
                };
            }
        };

        orders.forEach(o => {
            const m = o.get('month');
            const source = o.source || 'POS';
            const type = o.type || 'dine-in';
            const amount = parseFloat(o.get('revenue') || 0);

            initMonth(m);
            reportMap[m].revenue += amount;

            // Classify Revenue
            const isOnline = ['Zomato', 'Swiggy', 'UberEats', 'MagicPin'].includes(source);

            if (isOnline) {
                reportMap[m].breakdown.online.total += amount;
                reportMap[m].breakdown.online.sources[source] = (reportMap[m].breakdown.online.sources[source] || 0) + amount;
            } else {
                // Offline / Physical Store
                reportMap[m].breakdown.offline.total += amount;
                // Use 'type' for breakdown (dine-in, takeaway, etc)
                // If source is POS/ScanOrder, rely on type.
                reportMap[m].breakdown.offline.types[type] = (reportMap[m].breakdown.offline.types[type] || 0) + amount;
            }
        });

        purchases.forEach(p => {
            const m = p.get('month');
            initMonth(m);
            reportMap[m].cost = parseFloat(p.get('cost') || 0);
        });

        // Finalize Profit
        Object.values(reportMap).forEach(item => {
            item.profit = item.revenue - item.cost;
        });

        // Sort DESC
        const report = Object.values(reportMap).sort((a, b) => b.month.localeCompare(a.month));

        res.json(report);

    } catch (error) {
        console.error('Error fetching P&L:', error);
        res.status(500).json({ error: 'Failed to fetch Profit & Loss report' });
    }
};
