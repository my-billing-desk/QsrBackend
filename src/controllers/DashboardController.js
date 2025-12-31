const { Order, OrderItem, Purchase, Aggregator, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function to calculate time since
function timeSince(date) {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}


exports.getStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStart, queryEnd;

        if (startDate && endDate) {
            queryStart = new Date(startDate);
            if (startDate.includes('T') === false) queryStart.setHours(0, 0, 0, 0);

            queryEnd = new Date(endDate);
            if (endDate.includes('T') === false) queryEnd.setHours(23, 59, 59, 999);
        } else {
            // Default: Today
            queryStart = new Date();
            queryStart.setHours(0, 0, 0, 0);

            queryEnd = new Date();
            queryEnd.setHours(23, 59, 59, 999);
        }

        // Fetch orders and filter in memory to avoid Timezone/SQLite date weirdness
        const rawOrders = await Order.findAll({
            where: { tenantId: req.tenantId },
            limit: 2000,
            order: [['createdAt', 'DESC']]
        });

        // Filter orders by date range
        const validOrders = rawOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= queryStart && orderDate <= queryEnd && o.status !== 'cancelled';
        });

        // Calculate basic stats
        const totalOrders = validOrders.length;
        const totalIncome = validOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const successful = validOrders.filter(o => o.status === 'completed' || o.status === 'paid').length;
        const cancelled = rawOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= queryStart && orderDate <= queryEnd && o.status === 'cancelled';
        }).length;
        const complimentary = validOrders.filter(o => o.status === 'complimentary').length;

        // Unique customers
        const uniquePhones = new Set();
        validOrders.forEach(o => {
            if (o.customerPhone) uniquePhones.add(o.customerPhone);
        });
        const uniqueConnects = uniquePhones.size;
        const avgPerCustomer = uniqueConnects > 0 ? (totalIncome / uniqueConnects) : 0;

        // Type breakdowns
        const dineInOrders = validOrders.filter(o => o.type && o.type.toLowerCase().includes('dine'));
        const takeAwayOrders = validOrders.filter(o => o.type && o.type.toLowerCase().includes('take'));
        const deliveryOrders = validOrders.filter(o => o.type && o.type.toLowerCase().includes('delivery'));

        const dineInTotal = dineInOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const takeAwayTotal = takeAwayOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const deliveryTotal = deliveryOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        const dineInCount = dineInOrders.length;
        const takeAwayCount = takeAwayOrders.length;
        const deliveryCount = deliveryOrders.length;

        // Online/Aggregator Orders
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

        // POS Orders (Everything Else - Dine In, Take Away, etc.)
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

        // --- Added Stats ---

        // Online Orders Breakdown (Dynamic)
        // Aggregator might be global, checking tenantId if applicable or skipping if global
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

        // Customer Type Breakdown
        // Simplistic: For the filtered set, how many are 1st order vs repeat?
        // Better: For the period, how many distinct customers? 
        // We already have uniqueConnects (unique phones).
        // Total Orders = totalOrders.
        // If 100 orders, 80 unique phones.
        // It's hard to strict "New vs Returning" without checking history for EACH customer.
        // Heuristic: users with multiple orders IN THIS PERIOD are returning? No.

        // Let's rely on "Customer" table if it exists? Or just aggregate Order history.
        // For MVP Speed:
        // Returning = totalOrders - uniqueConnects (Repeat visits in this period) + a factor?
        // Let's look at `Order` table count per phone.
        // Since we filtered `validOrders` by date, we might miss "New" status if their first order was last year.
        // Assume: We can't easily distinguish global New/Returning without a heavy query.
        // Return placeholder derived from current data for now to remove static hardcode.
        // "Returning" ~ (Total - Unique). "First Time" ~ Unique.
        const returningCount = Math.max(0, totalOrders - uniqueConnects);
        const firstTimeCount = uniqueConnects;

        // Payment stats by method
        const paymentStats = validOrders.reduce((acc, o) => {
            const method = o.paymentMethod || 'Cash';
            if (!acc[method]) {
                acc[method] = { count: 0, total: 0 };
            }
            acc[method].count++;
            acc[method].total += parseFloat(o.totalAmount) || 0;
            return acc;
        }, {});

        // Expenses from Purchase (Inventory)
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
            customerStats: {
                firstTime: firstTimeCount,
                returning: returningCount
            },
            expenseStats: {
                totalExpenses,
                withdrawal: 0
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Error fetching dashboard stats" });
    }
};

exports.getCharts = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStart, queryEnd;

        if (startDate && endDate) {
            queryStart = new Date(startDate);
            if (startDate.includes('T') === false) queryStart.setHours(0, 0, 0, 0);

            queryEnd = new Date(endDate);
            if (endDate.includes('T') === false) queryEnd.setHours(23, 59, 59, 999);
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

        // ... chart logic ... (omitted for brevity, unchanged)

        const diffHours = (queryEnd - queryStart) / (1000 * 60 * 60);
        let labels = [];
        let data = [];

        if (diffHours <= 26) { // Approx 1 day with margin
            // Time Slots Layout
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
                    // Handle 0-2am as 24-26 for the last slot if needed, or simple direct matching
                    // If order is at 01:00 am, h=1. 
                    // Slot 10pm-02am means 22 to 02.
                    // If h < 2 (early morning), treat as next day for binning? No, "Today" includes 00:00 to 23:59.
                    // 10pm-2am really means 22:00 to 26:00 (next day 2am).
                    // If an order is 01:00 AM today, it belongs to "10pm - 02am" slot of YESTERDAY effectively?
                    // Or "Last Night"? 
                    // Let's simplified: If h >= 22, it matches. If h < 2, it matches the *end* of the slot.
                    if (slot.start === 22 && (h >= 22 || h < 2)) return sum + (o.totalAmount || 0);

                    if (h >= slot.start && h < slot.end) return sum + (o.totalAmount || 0);
                    return sum;
                }, 0);
            });
        } else {
            // Daily binning
            const grouped = {};
            // Init labels with dates in range? Or just sparse? Sparse is easier.
            // Better: dense labels for chart consistency?
            // Sparse for now.
            rawOrders.forEach(o => {
                const d = new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                grouped[d] = (grouped[d] || 0) + (o.totalAmount || 0);
            });
            labels = Object.keys(grouped);
            data = Object.values(grouped);
        }

        // Keep Top Items simple or mock if query is expensive
        // Re-implement basic top items
        const topItems = [];

        res.json({
            revenue: { labels, data },
            topItems
        });
    } catch (error) {
        console.error("Dashboard Chart Error:", error);
        res.status(500).json({ message: "Error fetching dashboard charts" });
    }
};

exports.getRecentOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const whereClause = { tenantId: req.tenantId };

        if (startDate && endDate) {
            const queryStart = new Date(startDate);
            if (!startDate.includes('T')) queryStart.setHours(0, 0, 0, 0);

            const queryEnd = new Date(endDate);
            if (!endDate.includes('T')) queryEnd.setHours(23, 59, 59, 999);

            whereClause.createdAt = { [Op.between]: [queryStart, queryEnd] };
        }

        const recentOrders = await Order.findAll({
            where: whereClause,
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'orderNumber', 'customerName', 'totalAmount', 'status', 'createdAt', 'type', 'source']
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
        const { startDate, endDate } = req.query;
        const orderWhere = { tenantId: req.tenantId };

        if (startDate && endDate) {
            const queryStart = new Date(startDate);
            if (!startDate.includes('T')) queryStart.setHours(0, 0, 0, 0);

            const queryEnd = new Date(endDate);
            if (!endDate.includes('T')) queryEnd.setHours(23, 59, 59, 999);

            orderWhere.createdAt = { [Op.between]: [queryStart, queryEnd] };
        }

        const topItemsData = await OrderItem.findAll({
            include: [{
                model: Order,
                where: orderWhere,
                attributes: []
            }],
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
