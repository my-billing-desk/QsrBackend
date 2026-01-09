const { Order, OrderItem, Recipe, RecipeIngredient, RawMaterial, Setting } = require('../models');

const { Op } = require('sequelize');

// Helper to consume stock
const consumeStock = async (items) => {
    // Check Global Auto Consumption Setting
    const setting = await Setting.findOne({ where: { key: 'auto_consumption_enabled' } });
    if (setting && setting.value === 'false') {
        return; // Auto consumption disabled globally
    }

    for (const item of items) {
        try {
            // 1. Find Recipe
            let recipe = null;

            // Priority: Variant-specific recipe -> Item-specific recipe
            if (item.variantId) {
                recipe = await Recipe.findOne({
                    where: { variantId: item.variantId },
                    include: [{ model: RecipeIngredient }]
                });
            }

            if (!recipe) {
                recipe = await Recipe.findOne({
                    where: { itemId: item.itemId, variantId: null },
                    include: [{ model: RecipeIngredient }]
                });
            }

            // 2. Consume Ingredients
            if (recipe && recipe.RecipeIngredients) {
                // Check if Auto Consumption is enabled (Default to true if null/undefined)
                if (recipe.autoConsumption !== false) {
                    for (const ingredient of recipe.RecipeIngredients) {
                        const yieldQty = recipe.yieldQty || 1;
                        const consumption = (ingredient.quantity / yieldQty) * item.quantity;
                        const material = await RawMaterial.findByPk(ingredient.rawMaterialId);

                        if (material) {
                            // We use simple update instead of decrement to avoid potential concurrency confusion if not in transaction, 
                            // though decrement is generally safe.
                            await material.decrement('currentStock', { by: consumption });
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to consume stock for item ${item.itemName}:`, err);
            // We don't block order creation for stock errors, but log it
        }
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { startDate, endDate, orderNumber, type, status, paymentMode, customerName } = req.query;

        let whereClause = { tenantId: req.tenantId };

        // Date Range Filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.createdAt = {
                [Op.between]: [start, end]
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
        if (req.query.source) whereClause.source = req.query.source;
        if (req.query.tableNumber) whereClause.tableNumber = req.query.tableNumber;

        // Polling filters
        if (req.query.isKotPrinted !== undefined) {
            whereClause.isKotPrinted = req.query.isKotPrinted === 'true';
        }
        if (req.query.printBillRequested !== undefined) {
            whereClause.printBillRequested = req.query.printBillRequested === 'true';
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [{ model: OrderItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('getOrders Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { items, ...orderData } = req.body;

        // Auto-generate order number if missing (e.g. from Scan & Order)
        if (!orderData.orderNumber) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            orderData.orderNumber = `SO-${timestamp}-${random}`;
        }

        // Calculate totals if not provided (basic validation)
        let calculatedTotal = 0;
        const activeTotal = orderData.totalAmount;

        // Create Order
        const order = await Order.create({ ...orderData, tenantId: req.tenantId });

        // Update Customer Stats
        if (orderData.customerId) {
            const { Customer } = require('../models');
            const customer = await Customer.findByPk(orderData.customerId);
            if (customer) {
                await customer.update({
                    totalSpend: parseFloat(customer.totalSpend) + parseFloat(orderData.totalAmount),
                    totalOrders: customer.totalOrders + 1,
                    lastVisit: new Date()
                });
            }
        }

        // Handle Gift Card Payment
        if (orderData.paymentMode === 'Gift Card' && orderData.giftCardNumber) {
            const { GiftCard, GiftCardTransaction } = require('../models');
            const card = await GiftCard.findOne({
                where: { cardNumber: orderData.giftCardNumber, tenantId: req.tenantId }
            });

            if (card && card.balance >= orderData.totalAmount) {
                await card.decrement('balance', { by: orderData.totalAmount });
                await GiftCardTransaction.create({
                    giftCardId: card.id,
                    type: 'redemption',
                    amount: orderData.totalAmount,
                    orderId: order.id,
                    tenantId: req.tenantId
                });
            } else {
                // If card not found or insufficient balance, we might want to flag the order or throw error
                // For now, just log it. In a real scenario, this should be validated before order creation.
                console.error('Gift card payment failed: Insufficient balance or card not found');
            }
        }

        // Create Order Items
        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                ...item,
                orderId: order.id,
                total: item.price * item.quantity
            }));

            await OrderItem.bulkCreate(orderItems);

            // Trigger Stock Consumption
            // We pass the original 'items' from request as they contain itemId/variantId
            // The orderItems constructed above might lose some props if not careful, but 'items' has everything needed.
            await consumeStock(items);

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

        // Trigger Loyalty Processing if order is completed
        if (order.status === 'completed') {
            const { processOrderLoyalty } = require('./LoyaltyController');
            processOrderLoyalty(order.id, req.tenantId);
        }

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
            const existing = await Order.findOne({ where: { orderNumber: orderData.orderNumber, tenantId: req.tenantId } });
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

        const order = await Order.findOne({ where: { id, tenantId: req.tenantId } });
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

        // Check if loyalty processing is needed
        if (updateData.status === 'completed' || order.status === 'completed') {
            const { processOrderLoyalty } = require('./LoyaltyController');
            processOrderLoyalty(id, req.tenantId);
        }

        const refreshed = await Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] });
        res.json(refreshed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markKotPrinted = async (req, res) => {
    try {
        const { id } = req.body;
        const order = await Order.findOne({ where: { id, tenantId: req.tenantId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        await order.update({ isKotPrinted: true });
        res.json({ message: 'Marked as printed', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
