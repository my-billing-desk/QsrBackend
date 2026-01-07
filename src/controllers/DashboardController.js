const { Order, OrderItem, Purchase, Aggregator, sequelize } = require('../models');
const { Op } = require('sequelize');

function timeSince(date) {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min ago";
    return Math.floor(seconds) + "sec ago";
}

exports.getStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStart, queryEnd;

        if (startDate && endDate) {
            queryStart = new Date(startDate);
            queryEnd = new Date(endDate);
            if (!endDate.includes('T')) {
                queryEnd.setHours(23, 59, 59, 999);
            }
        } else {
            queryStart = new Date();
            queryStart.setHours(0, 0, 0, 0);
            queryEnd = new Date();
            queryEnd.setHours(23, 59, 59, 999);
        }

        const rawOrders = await Order.findAll({
            where: { tenantId: req.tenantId },
            limit: 2000,
            order: [['createdAt', 'DESC']]
        });

        const validOrders = rawOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d >= queryStart && d <= queryEnd && o.status !== 'cancelled';
        });

        const totalIncome = validOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const totalOrders = validOrders.length;
        const customers = validOrders.map(o => o.customerPhone).filter(p => p);
        const uniqueConnects = [...new Set(customers)].length;
        const avgPerCustomer = uniqueConnects > 0 ? (totalIncome / uniqueConnects) : 0;

        const dineInOrders = validOrders.filter(o => o.type === 'Dine In');
        const takeAwayOrders = validOrders.filter(o => o.type === 'Take Away');
        const deliveryOrders = validOrders.filter(o => o.type && (o.type.toLowerCase().includes('delivery') || o.type.toLowerCase().includes('online') || o.type.toLowerCase().includes('zomato') || o.type.toLowerCase().includes('swiggy')));

        const dineInTotal = dineInOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const takeAwayTotal = takeAwayOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const deliveryTotal = deliveryOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

        const dineInCount = dineInOrders.length;
        const takeAwayCount = takeAwayOrders.length;
        const deliveryCount = deliveryOrders.length;

        const successful = validOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
        const cancelled = rawOrders.filter(o => o.status === 'cancelled' && new Date(o.createdAt) >= queryStart && new Date(o.createdAt) <= queryEnd).length;
        const complimentary = validOrders.filter(o => o.status === 'complimentary').length;

        const paymentStats = validOrders.reduce((acc, o) => {
            const method = o.paymentMethod || 'Cash';
            if (!acc[method]) acc[method] = { count: 0, total: 0 };
            acc[method].count += 1;
            acc[method].total += (parseFloat(o.totalAmount) || 0);
            return acc;
        }, {});

        const lastOnlineOrder = await Order.findOne({
            where: {
                tenantId: req.tenantId,
                type: {
                    [Op.or]: [
                        { [Op.like]: '%Delivery%' },
                        { [Op.like]: '%Online%' },
                        { [Op.like]: '%Zomato%' },
                        { [Op.like]: '%Swiggy%' }
                    ]
                }
            },
            order: [['createdAt', 'DESC']]
        });

        const lastPosOrder = await Order.findOne({
            where: {
                tenantId: req.tenantId,
                [Op.or]: [
                    { type: { [Op.is]: null } },
                    {
                        [Op.and]: [
                            { type: { [Op.notLike]: '%Delivery%' } },
                            { type: { [Op.notLike]: '%Online%' } },
                            { type: { [Op.notLike]: '%Zomato%' } },
                            { type: { [Op.notLike]: '%Swiggy%' } }
                        ]
                    }
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        const orderSynced = timeSince(lastOnlineOrder?.createdAt);
        const posSynced = timeSince(lastPosOrder?.createdAt);

        const connectedAggregators = await Aggregator.findAll({
            where: { isConnected: true, tenantId: req.tenantId },
            attributes: ['name', 'slug']
        });

        const onlineStats = connectedAggregators.map(agg => {
            const sourceOrders = validOrders.filter(o =>
                (o.source && o.source.toLowerCase().includes(agg.slug.toLowerCase())) ||
                (o.source && o.source.toLowerCase().includes(agg.name.toLowerCase())) ||
                (o.type && o.type.toLowerCase().includes(agg.slug.toLowerCase()))
            );
            return {
                name: agg.name,
                count: sourceOrders.length,
                total: sourceOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0)
            };
        });

        const expenses = await Purchase.findAll({
            where: {
                createdAt: { [Op.between]: [queryStart, queryEnd] },
                tenantId: req.tenantId
            }
        });
        const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.grandTotal) || 0), 0);

        res.json({
            totalIncome,
            totalOrders,
            totalCustomers: uniqueConnects,
            avgPerCustomer,
            dineInTotal,
            takeAwayTotal,
            deliveryTotal,
            dineInCount,
            takeAwayCount,
            deliveryCount,
            orderStats: {
                successful,
                cancelled,
                complimentary
            },
            leakage: {
                bills: { modified: 0, reprinted: 0, waived: 0 },
                kots: { cancelled: cancelled, modified: 0, notUsed: 0, shifted: 0 }
            },
            syncStatus: {
                orderSynced,
                posSynced
            },
            onlineStats,
            paymentStats,
            expenseStats: {
                totalExpenses,
                withdrawal: 0
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error Detail:", {
            message: error.message,
            stack: error.stack,
            query: req.query,
            tenantId: req.tenantId
        });
        res.status(500).json({ message: "Error fetching dashboard stats" });
    }
};

exports.getCharts = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStart, queryEnd;

        if (startDate && endDate) {
            queryStart = new Date(startDate);
            queryEnd = new Date(endDate);
            if (!endDate.includes('T')) queryEnd.setHours(23, 59, 59, 999);
        } else {
            queryStart = new Date();
            queryStart.setHours(0, 0, 0, 0);
            queryEnd = new Date();
            queryEnd.setHours(23, 59, 59, 999);
        }

        const rawOrders = await Order.findAll({
            where: {
                createdAt: { [Op.between]: [queryStart, queryEnd] },
                status: { [Op.ne]: 'cancelled' },
                tenantId: req.tenantId
            },
            attributes: ['createdAt', 'totalAmount', 'type']
        });

        const diffHours = (queryEnd - queryStart) / (1000 * 60 * 60);
        let labels = [];
        let data = [];

        if (diffHours <= 26) {
            const slots = [
                { label: '02:00am - 06:00am', start: 2, end: 6 },
                { label: '06:00am - 10:00am', start: 6, end: 10 },
                { label: '10:00am - 02:00pm', start: 10, end: 14 },
                { label: '02:00pm - 06:00pm', start: 14, end: 18 },
                { label: '06:00pm - 10:00pm', start: 18, end: 22 },
                { label: '10:00pm - 02:00am', start: 22, end: 26 }
            ];

            labels = slots.map(s => s.label);
            data = slots.map(slot => {
                return rawOrders.reduce((sum, o) => {
                    let h = new Date(o.createdAt).getHours();
                    if (slot.start === 22 && (h >= 22 || h < 2)) return sum + (o.totalAmount || 0);
                    if (h >= slot.start && h < slot.end) return sum + (o.totalAmount || 0);
                    return sum;
                }, 0);
            });
        } else {
            const grouped = {};
            rawOrders.forEach(o => {
                const d = new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                grouped[d] = (grouped[d] || 0) + (o.totalAmount || 0);
            });
            labels = Object.keys(grouped);
            data = Object.values(grouped);
        }

        res.json({
            revenue: { labels, data },
            topItems: []
        });
    } catch (error) {
        console.error("Dashboard Chart Error:", error);
        res.status(500).json({ message: "Error fetching dashboard charts" });
    }
};

exports.getRecentOrders = async (req, res) => {
    try {
        const recentOrders = await Order.findAll({
            where: { tenantId: req.tenantId },
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
    try {
        const topItemsData = await OrderItem.findAll({
            include: [{
                model: Order,
                where: { tenantId: req.tenantId },
                attributes: []
            }],
            attributes: [
                'itemName',
                [sequelize.fn('SUM', sequelize.col('OrderItem.price')), 'totalValue'],
                [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'count']
            ],
            group: ['itemName'],
            order: [[sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']],
            limit: 5,
            raw: true
        });

        res.json(topItemsData);
    } catch (error) {
        console.error("Dashboard Top Items Error:", error);
        res.status(500).json({ message: "Error fetching top items" });
    }
};
