const { Customer, Order, OrderItem, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

// 1. Get All Customers with Stats
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where: { tenantId: req.tenantId },
            order: [['totalSpend', 'DESC']]
        });
        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
};

// 2. Get Customer Detail with History & Favorites
exports.getCustomerDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findOne({
            where: { id, tenantId: req.tenantId }
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Get Order History
        const orders = await Order.findAll({
            where: { customerId: id, tenantId: req.tenantId },
            include: [{ model: OrderItem, as: 'items' }],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        // Get Favorites (Most ordered items)
        const favorites = await OrderItem.findAll({
            attributes: [
                'itemId',
                [sequelize.fn('COUNT', sequelize.col('itemId')), 'orderCount'],
                [sequelize.fn('MAX', sequelize.col('itemName')), 'itemName']
            ],
            include: [{
                model: Order,
                where: { customerId: id, tenantId: req.tenantId },
                attributes: []
            }],
            group: ['itemId'],
            order: [[sequelize.fn('COUNT', sequelize.col('itemId')), 'DESC']],
            limit: 5
        });

        res.json({
            success: true,
            data: {
                profile: customer,
                recentOrders: orders,
                favorites: favorites
            }
        });
    } catch (error) {
        console.error('Error fetching customer detail:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customer detail' });
    }
};

// 3. Create/Update Customer
exports.saveCustomer = async (req, res) => {
    try {
        const { id, phone, ...data } = req.body;
        let customer;

        if (id) {
            customer = await Customer.findOne({ where: { id, tenantId: req.tenantId } });
            if (customer) await customer.update(data);
        } else {
            // Check if phone already exists
            const existing = await Customer.findOne({ where: { phone, tenantId: req.tenantId } });
            if (existing) {
                await existing.update(data);
                customer = existing;
            } else {
                customer = await Customer.create({ ...data, phone, tenantId: req.tenantId });
            }
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Error saving customer:', error);
        res.status(500).json({ success: false, message: 'Failed to save customer' });
    }
};

// 4. Customer Stats for Dashboard
exports.getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await Customer.count({ where: { tenantId: req.tenantId } });
        const newThisMonth = await Customer.count({
            where: {
                tenantId: req.tenantId,
                createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
        });

        const topSpenders = await Customer.findAll({
            where: { tenantId: req.tenantId },
            order: [['totalSpend', 'DESC']],
            limit: 5
        });

        res.json({
            success: true,
            data: {
                totalCustomers,
                newThisMonth,
                topSpenders
            }
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customer stats' });
    }
};
