const { Order, OrderItem, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Fetch orders for today
        const orders = await Order.findAll({
            where: {
                createdAt: {
                    [Op.between]: [todayStart, todayEnd]
                },
                status: { [Op.ne]: 'cancelled' }
            }
        });

        // Total Income for today
        const totalIncome = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Total Orders for today
        const totalOrders = orders.length;

        // Total Customers (Approx based on unique phone or name, here simplified to count of orders with customer info)
        // Or unique phone numbers
        const uniqueConnects = new Set(orders.map(o => o.customerPhone).filter(Boolean)).size;

        // Avg per customer (Income / unique customers or total orders)
        // Usually avg order value
        const avgPerCustomer = totalOrders > 0 ? (totalIncome / totalOrders).toFixed(0) : 0;

        // Online vs DineIn/Takeaway counts if needed for charts
        // ...

        res.json({
            totalIncome,
            totalOrders,
            totalCustomers: uniqueConnects,
            avgPerCustomer
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Error fetching dashboard stats" });
    }
};

exports.getCharts = async (req, res) => {
    try {
        // Revenue Trend (Last 7 days or similar)
        // For now, let's just do hourly breakdown for today as requested in some contexts, or last 12 months.
        // Let's implement a simple "Last 7 Days" revenue.

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const revenueData = await Order.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
            ],
            where: {
                createdAt: { [Op.gte]: sevenDaysAgo },
                status: { [Op.ne]: 'cancelled' }
            },
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        });

        const revenueLabels = [];
        const revenueValues = [];

        // Fill gaps if needed, but for MVP just sending what we have
        revenueData.forEach(d => {
            revenueLabels.push(d.get('date'));
            revenueValues.push(d.get('total'));
        });


        // Category/Item popularity (Top 5 items)
        const topItemsData = await OrderItem.findAll({
            attributes: [
                'itemName',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'count']
            ],
            include: [{
                model: Order,
                attributes: [],
                where: { status: { [Op.ne]: 'cancelled' } }
            }],
            group: ['itemName'],
            order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
            limit: 5
        });

        const topItems = topItemsData.map(i => ({
            name: i.itemName,
            count: i.get('count')
        }));

        res.json({
            revenue: {
                labels: revenueLabels,
                data: revenueValues
            },
            topItems: topItems
        });

    } catch (error) {
        console.error("Dashboard Chart Error:", error);
        res.status(500).json({ message: "Error fetching dashboard charts" });
    }
};

exports.getRecentOrders = async (req, res) => {
    try {
        const recentOrders = await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'orderNumber', 'customerName', 'totalAmount', 'status', 'createdAt', 'type']
        });
        res.json(recentOrders);
    } catch (error) {
        console.error("Dashboard Recent Orders Error:", error);
        res.status(500).json({ message: "Error fetching recent orders" });
    }
};

exports.getTopItems = async (req, res) => {
    // Reusing logic from charts or separate if detailed
    try {
        const topItemsData = await OrderItem.findAll({
            attributes: [
                'itemName',
                [sequelize.fn('SUM', sequelize.col('OrderItem.price')), 'totalValue'], // revenue from this item
                [sequelize.fn('SUM', sequelize.col('quantity')), 'count']
            ],
            group: ['itemName'],
            order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
            limit: 5
        });

        res.json(topItemsData);
    } catch (error) {
        console.error("Dashboard Top Items Error:", error);
        res.status(500).json({ message: "Error fetching top items" });
    }
}
