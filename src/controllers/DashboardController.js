const { Order, OrderItem, Purchase, Aggregator, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let queryStart, queryEnd;

        if (startDate && endDate) {
            queryStart = new Date(startDate);
            // If it's a full ISO string, use it. If it's YYYY-MM-DD, set to start of day for start, end of day logic for end
            // But usually frontend sends full ISO or we treat it carefully.
            // Let's assume start implies 00:00:00 of that day if time not given? 
            // Better: Frontend sends "2023-12-14T00:00:00" and "2023-12-14T23:59:59".

            queryEnd = new Date(endDate);
            // Safety: if endDate provided looks like a plain date, ensure we capture the end of it
            if (!endDate.includes('T')) {
                queryEnd.setHours(23, 59, 59, 999);
            }
        } else {
            // Default: Today
            queryStart = new Date();
            queryStart.setHours(0, 0, 0, 0);

            queryEnd = new Date();
            queryEnd.setHours(23, 59, 59, 999);
        }

        // Fetch orders and filter in memory to avoid Timezone/SQLite date weirdness
        const rawOrders = await Order.findAll({
            limit: 2000,
            order: [['createdAt', 'DESC']]
        });

        const allOrders = rawOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d >= queryStart && d <= queryEnd;
        });

        // Filter for valid sales (not cancelled)
        const validOrders = allOrders.filter(o => o.status !== 'cancelled');

        // Total Income (only from valid orders)
        const totalIncome = validOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
        const totalOrders = validOrders.length;

        // Customers
        const uniqueConnects = new Set(validOrders.map(o => o.customerPhone).filter(Boolean)).size;
        const avgPerCustomer = totalOrders > 0 ? (totalIncome / totalOrders).toFixed(0) : 0;

        // Breakdown Types
        let dineInTotal = 0;
        let takeAwayTotal = 0;
        let deliveryTotal = 0;
        let dineInCount = 0;
        let takeAwayCount = 0;
        let deliveryCount = 0;

        validOrders.forEach(order => {
            const amount = parseFloat(order.totalAmount) || 0;
            const type = (order.type || '').toLowerCase().replace(/[^a-z]/g, '');

            if (type.includes('dine')) {
                dineInTotal += amount;
                dineInCount++;
            } else if (type.includes('take')) {
                takeAwayTotal += amount;
                takeAwayCount++;
            } else if (type.includes('delivery')) {
                deliveryTotal += amount;
                deliveryCount++;
            } else {
                dineInTotal += amount; // Default
                dineInCount++;
            }
        });

        // Order Stats Counters
        const successful = validOrders.length;
        const cancelled = allOrders.filter(o => o.status === 'cancelled').length;
        const complimentary = allOrders.filter(o => o.status === 'complimentary' || (o.totalAmount === 0 && o.status !== 'cancelled')).length;

        // Sync Status Calculation
        const timeSince = (date) => {
            if (!date) return 'Never';
            const diffMs = new Date() - new Date(date);
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} Mins ago`;

            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            if (hours < 24) return `${hours}h ${mins}m ago`;

            return `${Math.floor(hours / 24)} Days ago`;
        };

        // Online/Aggregator Orders
        const lastOnlineOrder = await Order.findOne({
            where: {
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
        const connectedAggregators = await Aggregator.findAll({
            where: { isConnected: true },
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

        // Payment Bifurcation
        const paymentStats = {
            cash: { count: 0, total: 0 },
            card: { count: 0, total: 0 },
            upi: { count: 0, total: 0 },
            others: { count: 0, total: 0 }
        };

        validOrders.forEach(o => {
            const mode = (o.paymentMode || 'Cash').toLowerCase();
            const amount = parseFloat(o.totalAmount) || 0;
            if (mode.includes('cash')) {
                paymentStats.cash.count++;
                paymentStats.cash.total += amount;
            } else if (mode.includes('card') || mode.includes('credit') || mode.includes('debit')) {
                paymentStats.card.count++;
                paymentStats.card.total += amount;
            } else if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe')) {
                paymentStats.upi.count++;
                paymentStats.upi.total += amount;
            } else {
                paymentStats.others.count++;
                paymentStats.others.total += amount;
            }
        });

        // Expenses form Purchase (Inventory)
        const expenses = await Purchase.findAll({
            where: {
                createdAt: { [Op.between]: [queryStart, queryEnd] }
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
                status: { [Op.ne]: 'cancelled' }
            },
            attributes: ['createdAt', 'totalAmount', 'type']
        });

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
