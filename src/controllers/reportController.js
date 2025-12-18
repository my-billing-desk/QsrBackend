const { Op } = require('sequelize');
const { Order, Purchase, sequelize } = require('../models');

exports.getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Default to last 6 months if not provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(end.getMonth() - 5));

        // 1. Fetch Revenue (Orders)
        // Group by Month-Year
        const orders = await Order.findAll({
            attributes: [
                [sequelize.fn('date_format', sequelize.col('createdAt'), '%Y-%m'), 'month'],
                [sequelize.fn('sum', sequelize.col('totalAmount')), 'revenue']
            ],
            where: {
                status: { [Op.not]: 'cancelled' },
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            group: [sequelize.fn('date_format', sequelize.col('createdAt'), '%Y-%m')],
            order: [[sequelize.col('month'), 'DESC']]
        });

        // 2. Fetch Cost (Purchases)
        const purchases = await Purchase.findAll({
            attributes: [
                [sequelize.fn('date_format', sequelize.col('invoiceDate'), '%Y-%m'), 'month'],
                [sequelize.fn('sum', sequelize.col('grandTotal')), 'cost']
            ],
            where: {
                invoiceDate: {
                    [Op.between]: [start, end]
                }
            },
            group: [sequelize.fn('date_format', sequelize.col('invoiceDate'), '%Y-%m')],
            order: [[sequelize.col('month'), 'DESC']]
        });

        // 3. Merge Data
        const reportMap = {};

        // Helper to init month object
        const initMonth = (m) => {
            if (!reportMap[m]) {
                reportMap[m] = {
                    month: m,
                    revenue: 0,
                    cost: 0,
                    profit: 0
                };
            }
        };

        orders.forEach(o => {
            const m = o.get('month');
            initMonth(m);
            reportMap[m].revenue = parseFloat(o.get('revenue') || 0);
        });

        purchases.forEach(p => {
            const m = p.get('month');
            initMonth(m);
            reportMap[m].cost = parseFloat(p.get('cost') || 0);
        });

        // Calculate Profit
        Object.values(reportMap).forEach(item => {
            item.profit = item.revenue - item.cost;
        });

        // Convert to array and sort DESC
        const report = Object.values(reportMap).sort((a, b) => b.month.localeCompare(a.month));

        res.json(report);

    } catch (error) {
        console.error('Error fetching P&L:', error);
        res.status(500).json({ error: 'Failed to fetch Profit & Loss report' });
    }
};
