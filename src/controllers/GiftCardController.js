const { GiftCard, GiftCardTransaction, Customer, sequelize } = require('../models');
const { Op } = require('sequelize');

// 1. Issue/Create Gift Card
exports.issueGiftCard = async (req, res) => {
    try {
        const { cardNumber, pin, initialAmount, expiryDate, type, customerId } = req.body;

        const card = await GiftCard.create({
            cardNumber,
            pin,
            initialAmount,
            balance: initialAmount,
            expiryDate,
            type,
            customerId,
            status: 'active',
            tenantId: req.tenantId
        });

        // Record Activation Transaction
        await GiftCardTransaction.create({
            giftCardId: card.id,
            type: 'activation',
            amount: initialAmount,
            tenantId: req.tenantId
        });

        res.status(201).json({ success: true, data: card });
    } catch (error) {
        console.error('Error issuing gift card:', error);
        res.status(500).json({ success: false, message: 'Failed to issue gift card' });
    }
};

// 2. Get Gift Card Details
exports.getGiftCard = async (req, res) => {
    try {
        const { cardNumber } = req.params;
        const card = await GiftCard.findOne({
            where: { cardNumber, tenantId: req.tenantId },
            include: [
                { model: GiftCardTransaction, as: 'transactions', limit: 10, order: [['createdAt', 'DESC']] },
                { model: Customer, as: 'customer' }
            ]
        });

        if (!card) {
            return res.status(404).json({ success: false, message: 'Gift card not found' });
        }

        res.json({ success: true, data: card });
    } catch (error) {
        console.error('Error fetching gift card:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch gift card' });
    }
};

// 3. Redeem Gift Card
exports.redeemGiftCard = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { cardNumber, pin, amount, orderId } = req.body;

        const card = await GiftCard.findOne({
            where: { cardNumber, tenantId: req.tenantId },
            transaction: t
        });

        if (!card) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Gift card not found' });
        }

        if (card.status !== 'active') {
            await t.rollback();
            return res.status(400).json({ success: false, message: `Gift card is ${card.status}` });
        }

        if (card.pin && card.pin !== pin) {
            await t.rollback();
            return res.status(401).json({ success: false, message: 'Invalid PIN' });
        }

        if (card.expiryDate && new Date(card.expiryDate) < new Date()) {
            card.status = 'expired';
            await card.save({ transaction: t });
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Gift card has expired' });
        }

        if (parseFloat(card.balance) < parseFloat(amount)) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        // Update Balance
        card.balance = parseFloat(card.balance) - parseFloat(amount);
        await card.save({ transaction: t });

        // Record Transaction
        await GiftCardTransaction.create({
            giftCardId: card.id,
            type: 'redemption',
            amount: amount,
            orderId,
            tenantId: req.tenantId
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, data: card });
    } catch (error) {
        await t.rollback();
        console.error('Error redeeming gift card:', error);
        res.status(500).json({ success: false, message: 'Failed to redeem gift card' });
    }
};

// 4. Reload Gift Card
exports.reloadGiftCard = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { cardNumber, amount } = req.body;

        const card = await GiftCard.findOne({
            where: { cardNumber, tenantId: req.tenantId },
            transaction: t
        });

        if (!card) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Gift card not found' });
        }

        card.balance = parseFloat(card.balance) + parseFloat(amount);
        await card.save({ transaction: t });

        await GiftCardTransaction.create({
            giftCardId: card.id,
            type: 'reload',
            amount: amount,
            tenantId: req.tenantId
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, data: card });
    } catch (error) {
        await t.rollback();
        console.error('Error reloading gift card:', error);
        res.status(500).json({ success: false, message: 'Failed to reload gift card' });
    }
};

// 5. List Gift Cards
exports.getAllGiftCards = async (req, res) => {
    try {
        const cards = await GiftCard.findAll({
            where: { tenantId: req.tenantId },
            include: [{ model: Customer, as: 'customer' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: cards });
    } catch (error) {
        console.error('Error fetching gift cards:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch gift cards' });
    }
};

// 6. Bulk Generate Gift Cards
exports.bulkGenerate = async (req, res) => {
    try {
        const { count, amount, prefix = 'GC', expiryDate } = req.body;
        const cards = [];

        for (let i = 0; i < count; i++) {
            const cardNumber = prefix + Math.random().toString(36).substring(2, 10).toUpperCase();
            cards.push({
                cardNumber,
                initialAmount: amount,
                balance: amount,
                expiryDate,
                status: 'active',
                tenantId: req.tenantId
            });
        }

        const createdCards = await GiftCard.bulkCreate(cards);

        // Record activations
        const transactions = createdCards.map(c => ({
            giftCardId: c.id,
            type: 'activation',
            amount: amount,
            tenantId: req.tenantId
        }));
        await GiftCardTransaction.bulkCreate(transactions);

        res.json({ success: true, count: createdCards.length });
    } catch (error) {
        console.error('Error bulk generating gift cards:', error);
        res.status(500).json({ success: false, message: 'Failed to generate gift cards' });
    }
};
