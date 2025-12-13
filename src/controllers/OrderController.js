const { Order, OrderItem } = require('../models');

const { Op } = require('sequelize');

exports.getOrders = async (req, res) => {
    try {
        const { startDate, endDate, orderNumber, type, status, paymentMode, customerName } = req.query;

        let whereClause = {};

        // Date Range Filter
        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.createdAt = { [Op.gte]: new Date(startDate) };
        }

        if (orderNumber) whereClause.orderNumber = { [Op.like]: `%${orderNumber}%` };
        if (type && type !== 'All') whereClause.type = type;
        if (status && status !== 'All') whereClause.status = status;
        if (paymentMode && paymentMode !== 'All') whereClause.paymentMode = paymentMode; // Assuming paymentMode added to Order model
        if (customerName) whereClause.customerName = { [Op.like]: `%${customerName}%` };
        if (req.query.customerPhone) whereClause.customerPhone = { [Op.like]: `%${req.query.customerPhone}%` };

        const orders = await Order.findAll({
            where: whereClause,
            include: [{ model: OrderItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { items, ...orderData } = req.body;

        // Calculate totals if not provided (basic validation)
        let calculatedTotal = 0;
        const activeTotal = orderData.totalAmount;

        // Create Order
        const order = await Order.create(orderData);

        // Create Order Items
        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                ...item,
                orderId: order.id,
                total: item.price * item.quantity
            }));

            await OrderItem.bulkCreate(orderItems);

            // Update total amount only if not provided by client (to preserve tax/packing logic from POS)
            if (activeTotal === undefined || activeTotal === null) {
                calculatedTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
                await order.update({ totalAmount: calculatedTotal });
            }
        }

        // Fetch complete order to return
        const createdOrder = await Order.findByPk(order.id, {
            include: [{ model: OrderItem, as: 'items' }]
        });

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateSync = async (req, res) => {
    // Logic for Desktop to sync offline orders (bulk create/upsert)
    // For now, simplistically using loop
    try {
        const orders = req.body; // Expecting array of orders
        const results = [];

        for (const orderData of orders) {
            // Find or Create logic based on unique orderNumber
            // Simplified for MVP: Just create if not exists
            const existing = await Order.findOne({ where: { orderNumber: orderData.orderNumber } });
            if (!existing) {
                // Create logic similar to single order but tailored
                // ...
            }
        }
        res.json({ message: 'Sync unimplemented for now, but endpoint exists' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, ...updateData } = req.body;

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update Order fields
        await order.update(updateData);

        // Update Items if provided
        if (items) {
            // 1. Remove existing items
            await OrderItem.destroy({ where: { orderId: id } });

            // 2. Add new items
            if (items.length > 0) {
                const orderItems = items.map(item => ({
                    ...item,
                    orderId: id,
                    total: item.price * item.quantity
                }));
                await OrderItem.bulkCreate(orderItems);
            }

            // 3. Recalculate total if needed
            // Only if totalAmount wasn't in the update payload
            if (updateData.totalAmount === undefined || updateData.totalAmount === null) {
                const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                await order.update({ totalAmount: total });
            }
        }

        // Return updated order with items
        const updatedOrder = await Order.findByPk(id, {
            include: [{ model: OrderItem, as: 'items' }]
        });

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
