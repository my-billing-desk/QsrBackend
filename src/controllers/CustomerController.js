const { Customer, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

/**
 * Lookup customer by phone number
 * Returns customer details, order history, and suggested items
 */
exports.lookupByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const tenantId = req.user.tenantId;

        // Validate phone number
        if (!phone || phone.length < 10) {
            return res.status(400).json({ error: 'Valid phone number required' });
        }

        // Find or create customer
        let customer = await Customer.findOne({
            where: { phone, tenantId }
        });

        let isNew = false;
        if (!customer) {
            // New customer - create basic record
            customer = await Customer.create({
                phone,
                tenantId,
                isActive: true
            });
            isNew = true;
        }

        // Initialize optional stats
        let recentOrders = [];
        let favoriteItems = [];
        let statsMessage = isNew ? 'Welcome! New customer' : 'Welcome back!';

        try {
            // Get recent order history (last 10 orders)
            recentOrders = await Order.findAll({
                where: { customerPhone: phone, tenantId },
                include: [{ model: OrderItem, as: 'items' }],
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            // Calculate favorite items from order history
            const itemFrequency = {};
            recentOrders.forEach(order => {
                if (order.items) {
                    order.items.forEach(item => {
                        if (!itemFrequency[item.itemId]) {
                            itemFrequency[item.itemId] = {
                                itemId: item.itemId,
                                itemName: item.itemName,
                                count: 0
                            };
                        }
                        itemFrequency[item.itemId].count += item.quantity;
                    });
                }
            });

            favoriteItems = Object.values(itemFrequency)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            if (!isNew) {
                statsMessage = `Welcome back! ${customer.totalOrders || 0} orders, ${customer.loyaltyPoints || 0} points`;
            }
        } catch (historyError) {
            console.error('History Fetch Error:', historyError);
            // Non-critical failure, continue with defaults
        }

        res.json({
            customer: {
                id: customer.id,
                phone: customer.phone,
                name: customer.name,
                email: customer.email,
                address: customer.address,
                loyaltyPoints: customer.loyaltyPoints,
                totalSpent: customer.totalSpent,
                totalOrders: customer.totalOrders,
                customerTier: customer.customerTier,
                lastOrderDate: customer.lastOrderDate,
                dietaryPreferences: customer.dietaryPreferences,
                notes: customer.notes
            },
            isNew,
            recentOrders: recentOrders.slice(0, 3), // Last 3 orders
            favoriteItems,
            suggestions: {
                message: statsMessage
            }
        });
    } catch (error) {
        console.error('Customer Lookup Error:', error);
        res.status(500).json({
            error: 'Failed to lookup customer',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Create or update customer
 */
exports.createOrUpdate = async (req, res) => {
    try {
        const { phone, name, email, address, dietaryPreferences, notes } = req.body;
        const tenantId = req.user.tenantId;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number required' });
        }

        let customer = await Customer.findOne({
            where: { phone, tenantId }
        });

        if (customer) {
            // Update existing customer
            await customer.update({
                name: name || customer.name,
                email: email || customer.email,
                address: address || customer.address,
                dietaryPreferences: dietaryPreferences || customer.dietaryPreferences,
                notes: notes || customer.notes
            });
        } else {
            // Create new customer
            customer = await Customer.create({
                phone,
                name,
                email,
                address,
                dietaryPreferences,
                notes,
                tenantId
            });
        }

        res.json({
            message: customer ? 'Customer updated' : 'Customer created',
            customer
        });
    } catch (error) {
        console.error('Create/Update error:', error);
        res.status(500).json({ error: 'Failed to save customer' });
    }
};

/**
 * Update customer after order completion
 * Call this after an order is paid
 */
exports.updatePostOrder = async (req, res) => {
    try {
        const { phone, orderTotal } = req.body;
        const tenantId = req.user.tenantId;

        const customer = await Customer.findOne({
            where: { phone, tenantId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Update statistics
        const newTotalOrders = customer.totalOrders + 1;
        const newTotalSpent = parseFloat(customer.totalSpent) + parseFloat(orderTotal);
        const newAvgOrderValue = newTotalSpent / newTotalOrders;

        // Calculate loyalty points (1 point per ₹10 spent)
        const pointsEarned = Math.floor(orderTotal / 10);

        // Determine tier based on total spent
        let tier = 'regular';
        if (newTotalSpent >= 50000) tier = 'platinum';
        else if (newTotalSpent >= 25000) tier = 'gold';
        else if (newTotalSpent >= 10000) tier = 'silver';

        await customer.update({
            totalOrders: newTotalOrders,
            totalSpent: newTotalSpent,
            averageOrderValue: newAvgOrderValue,
            loyaltyPoints: customer.loyaltyPoints + pointsEarned,
            customerTier: tier,
            lastOrderDate: new Date()
        });

        res.json({
            message: 'Customer updated',
            pointsEarned,
            totalPoints: customer.loyaltyPoints + pointsEarned,
            newTier: tier
        });
    } catch (error) {
        console.error('Post-order update error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

/**
 * Get all customers (for admin)
 */
exports.getAllCustomers = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { search, tier, limit = 50, offset = 0 } = req.query;

        const where = { tenantId };

        if (search) {
            where[Op.or] = [
                { phone: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        if (tier) {
            where.customerTier = tier;
        }

        const customers = await Customer.findAll({
            where,
            order: [['totalSpent', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const total = await Customer.count({ where });

        res.json({
            customers,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

/**
 * Get customer stats
 */
exports.getStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const [
            totalCustomers,
            activeCustomers,
            regularTier,
            silverTier,
            goldTier,
            platinumTier
        ] = await Promise.all([
            Customer.count({ where: { tenantId } }),
            Customer.count({ where: { tenantId, isActive: true } }),
            Customer.count({ where: { tenantId, customerTier: 'regular' } }),
            Customer.count({ where: { tenantId, customerTier: 'silver' } }),
            Customer.count({ where: { tenantId, customerTier: 'gold' } }),
            Customer.count({ where: { tenantId, customerTier: 'platinum' } })
        ]);

        res.json({
            totalCustomers,
            activeCustomers,
            tiers: {
                regular: regularTier,
                silver: silverTier,
                gold: goldTier,
                platinum: platinumTier
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

module.exports = exports;
