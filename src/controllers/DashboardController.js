const { Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        // Mocking real-time stats aggregation for now, or using real DB queries if data exists
        // In a real scenario, we would aggregate Order table data

        // Count orders for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const totalOrders = await Order.count({
            where: {
                createdAt: { [Op.gte]: startOfDay },
                status: { [Op.ne]: 'cancelled' }
            }
        });

        const totalSales = await Order.sum('totalAmount', {
            where: {
                createdAt: { [Op.gte]: startOfDay },
                status: { [Op.ne]: 'cancelled' }
            }
        }) || 0;

        const dineInOrders = await Order.count({
            where: {
                type: 'dine-in',
                createdAt: { [Op.gte]: startOfDay },
                status: { [Op.ne]: 'cancelled' }
            }
        });
        const takeawayOrders = await Order.count({
            where: {
                type: 'takeaway',
                createdAt: { [Op.gte]: startOfDay },
                status: { [Op.ne]: 'cancelled' }
            }
        });
        const deliveryOrders = await Order.count({
            where: {
                type: 'delivery',
                createdAt: { [Op.gte]: startOfDay },
                status: { [Op.ne]: 'cancelled' }
            }
        });

        res.json({
            totalSales: totalSales,
            totalOrders: totalOrders,
            dineIn: dineInOrders,
            takeaway: takeawayOrders,
            delivery: deliveryOrders,
            avgOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0
        });

    } catch (error) {
        console.error("Dashboard stats error", error);
        res.status(500).json({ error: error.message });
    }
};

exports.clearDatabase = async (req, res) => {
    try {
        const { Category, Item, Variant, Addon, Tax, Discount, Order, OrderItem } = require('../models');
        const { type } = req.body;

        if (type === 'orders') {
            // Clear only orders
            await OrderItem.destroy({ where: {}, truncate: false });
            await Order.destroy({ where: {}, truncate: false });
            res.json({ message: 'Sales data (Orders) cleared successfully' });
        } else {
            // Clear everything except Users (Full Reset)
            await OrderItem.destroy({ where: {}, truncate: false });
            await Order.destroy({ where: {}, truncate: false });
            await Variant.destroy({ where: {}, truncate: false });
            await Item.destroy({ where: {}, truncate: false });
            await Category.destroy({ where: {}, truncate: false });
            await Addon.destroy({ where: {}, truncate: false });
            await Tax.destroy({ where: {}, truncate: false });
            await Discount.destroy({ where: {}, truncate: false });
            res.json({ message: 'All database records (except Users) cleared successfully' });
        }
    } catch (error) {
        console.error("Clear DB error", error);
        res.status(500).json({ error: error.message });
    }
};
