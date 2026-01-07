const {
    Customer,
    LoyaltyConfig,
    LoyaltyTier,
    CustomerLoyalty,
    LoyaltyTransaction,
    LoyaltyReward,
    Order,
    sequelize
} = require('../models');
const { Op } = require('sequelize');

// 1. Get Loyalty Config
exports.getLoyaltyConfig = async (req, res) => {
    try {
        let config = await LoyaltyConfig.findOne({ where: { tenantId: req.tenantId } });
        if (!config) {
            config = await LoyaltyConfig.create({ tenantId: req.tenantId });
        }
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error fetching loyalty config:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch loyalty config' });
    }
};

// 2. Update Loyalty Config
exports.updateLoyaltyConfig = async (req, res) => {
    try {
        const [config, created] = await LoyaltyConfig.findOrCreate({
            where: { tenantId: req.tenantId },
            defaults: req.body
        });
        if (!created) {
            await config.update(req.body);
        }
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error updating loyalty config:', error);
        res.status(500).json({ success: false, message: 'Failed to update loyalty config' });
    }
};

// 3. Get Loyalty Tiers
exports.getLoyaltyTiers = async (req, res) => {
    try {
        const tiers = await LoyaltyTier.findAll({
            where: { tenantId: req.tenantId },
            order: [['minPoints', 'ASC']]
        });
        res.json({ success: true, data: tiers });
    } catch (error) {
        console.error('Error fetching loyalty tiers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch loyalty tiers' });
    }
};

// 4. Create/Update Loyalty Tier
exports.saveLoyaltyTier = async (req, res) => {
    try {
        const { id, ...data } = req.body;
        let tier;
        if (id) {
            tier = await LoyaltyTier.findOne({ where: { id, tenantId: req.tenantId } });
            if (tier) await tier.update(data);
        } else {
            tier = await LoyaltyTier.create({ ...data, tenantId: req.tenantId });
        }
        res.json({ success: true, data: tier });
    } catch (error) {
        console.error('Error saving loyalty tier:', error);
        res.status(500).json({ success: false, message: 'Failed to save loyalty tier' });
    }
};

// 5. Get Customer Loyalty Status
exports.getCustomerLoyalty = async (req, res) => {
    try {
        const { phone } = req.params;
        const customer = await Customer.findOne({
            where: { phone, tenantId: req.tenantId },
            include: [
                { model: CustomerLoyalty, as: 'loyalty', include: [{ model: LoyaltyTier, as: 'tier' }] },
                { model: LoyaltyTransaction, as: 'loyaltyTransactions', limit: 10, order: [['createdAt', 'DESC']] }
            ]
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Error fetching customer loyalty:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customer loyalty' });
    }
};

// 6. Process Order for Loyalty (Internal function or API)
exports.processOrderLoyalty = async (orderId, tenantId) => {
    const t = await sequelize.transaction();
    try {
        const order = await Order.findByPk(orderId, { transaction: t });
        if (!order || !order.customerPhone) return;

        // 1. Find or Create Customer
        let [customer, created] = await Customer.findOrCreate({
            where: { phone: order.customerPhone, tenantId },
            defaults: { name: order.customerName || 'Guest', tenantId },
            transaction: t
        });

        // 2. Find or Create Loyalty State
        let [loyalty, lCreated] = await CustomerLoyalty.findOrCreate({
            where: { customerId: customer.id, tenantId },
            transaction: t
        });

        // 3. Get Config
        const config = await LoyaltyConfig.findOne({ where: { tenantId }, transaction: t });
        if (!config || !config.isActive) {
            await t.commit();
            return;
        }

        // 4. Calculate Points
        let pointsEarned = 0;
        if (config.programType === 'points' || config.programType === 'tiered') {
            pointsEarned = Math.floor(order.totalAmount * config.pointsPerRupee);

            // Apply Tier Multiplier
            if (loyalty.tierId) {
                const tier = await LoyaltyTier.findByPk(loyalty.tierId, { transaction: t });
                if (tier) pointsEarned = Math.floor(pointsEarned * tier.multiplier);
            }
        }

        // 5. Update Loyalty State
        const updates = {
            currentPoints: loyalty.currentPoints + pointsEarned,
            lifetimePoints: loyalty.lifetimePoints + pointsEarned,
            visitCount: loyalty.visitCount + 1,
            walletBalance: parseFloat(loyalty.walletBalance)
        };

        if (config.programType === 'cashback') {
            const cashback = (order.totalAmount * config.cashbackPercentage) / 100;
            updates.walletBalance += cashback;
        }

        if (config.programType === 'stamp') {
            updates.currentStamps += 1;
        }

        // 6. Check for Tier Upgrade
        const nextTier = await LoyaltyTier.findOne({
            where: {
                tenantId,
                minPoints: { [Op.lte]: updates.lifetimePoints }
            },
            order: [['minPoints', 'DESC']],
            transaction: t
        });
        if (nextTier) updates.tierId = nextTier.id;

        await loyalty.update(updates, { transaction: t });

        // 7. Record Transaction
        if (pointsEarned > 0) {
            await LoyaltyTransaction.create({
                customerId: customer.id,
                type: 'earn',
                points: pointsEarned,
                orderId: order.id,
                description: `Points earned from order #${order.orderNumber}`,
                tenantId
            }, { transaction: t });
        }

        // 8. Update Order
        await order.update({ customerId: customer.id }, { transaction: t });

        await t.commit();
    } catch (error) {
        await t.rollback();
        console.error('Error processing order loyalty:', error);
    }
};

// 7. Get Loyalty Rewards
exports.getLoyaltyRewards = async (req, res) => {
    try {
        const rewards = await LoyaltyReward.findAll({
            where: { tenantId: req.tenantId },
            order: [['minPoints', 'ASC']]
        });
        res.json({ success: true, data: rewards });
    } catch (error) {
        console.error('Error fetching loyalty rewards:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch loyalty rewards' });
    }
};

// 8. Save Loyalty Reward
exports.saveLoyaltyReward = async (req, res) => {
    try {
        const { id, ...data } = req.body;
        let reward;
        if (id) {
            reward = await LoyaltyReward.findOne({ where: { id, tenantId: req.tenantId } });
            if (reward) await reward.update(data);
        } else {
            reward = await LoyaltyReward.create({ ...data, tenantId: req.tenantId });
        }
        res.json({ success: true, data: reward });
    } catch (error) {
        console.error('Error saving loyalty reward:', error);
        res.status(500).json({ success: false, message: 'Failed to save loyalty reward' });
    }
};

// 9. Delete Loyalty Reward
exports.deleteLoyaltyReward = async (req, res) => {
    try {
        const { id } = req.params;
        await LoyaltyReward.destroy({ where: { id, tenantId: req.tenantId } });
        res.json({ success: true, message: 'Reward deleted' });
    } catch (error) {
        console.error('Error deleting loyalty reward:', error);
        res.status(500).json({ success: false, message: 'Failed to delete loyalty reward' });
    }
};

// 10. Delete Loyalty Tier
exports.deleteLoyaltyTier = async (req, res) => {
    try {
        const { id } = req.params;
        await LoyaltyTier.destroy({ where: { id, tenantId: req.tenantId } });
        res.json({ success: true, message: 'Tier deleted' });
    } catch (error) {
        console.error('Error deleting loyalty tier:', error);
        res.status(500).json({ success: false, message: 'Failed to delete loyalty tier' });
    }
};

// 11. Get Loyalty Analytics
exports.getLoyaltyAnalytics = async (req, res) => {
    try {
        const totalCustomers = await Customer.count({ where: { tenantId: req.tenantId } });
        const activeLoyaltyMembers = await CustomerLoyalty.count({
            where: {
                tenantId: req.tenantId,
                lifetimePoints: { [Op.gt]: 0 }
            }
        });

        const pointsIssued = await LoyaltyTransaction.sum('points', {
            where: { tenantId: req.tenantId, type: 'earn' }
        }) || 0;

        const pointsRedeemed = await LoyaltyTransaction.sum('points', {
            where: { tenantId: req.tenantId, type: 'redeem' }
        }) || 0;

        res.json({
            success: true,
            data: {
                totalCustomers,
                activeLoyaltyMembers,
                pointsIssued,
                pointsRedeemed,
                redemptionRate: pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0
            }
        });
    } catch (error) {
        console.error('Error fetching loyalty analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch loyalty analytics' });
    }
};

// 12. Redeem Points
exports.redeemPoints = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { customerId, points, orderId, description } = req.body;

        const loyalty = await CustomerLoyalty.findOne({
            where: { customerId, tenantId: req.tenantId },
            transaction: t
        });

        if (!loyalty || loyalty.currentPoints < points) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Insufficient points' });
        }

        // Deduct Points
        loyalty.currentPoints -= points;
        await loyalty.save({ transaction: t });

        // Record Transaction
        await LoyaltyTransaction.create({
            customerId,
            type: 'redeem',
            points: points,
            orderId,
            description: description || `Points redeemed for order #${orderId}`,
            tenantId: req.tenantId
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, data: loyalty });
    } catch (error) {
        await t.rollback();
        console.error('Error redeeming points:', error);
        res.status(500).json({ success: false, message: 'Failed to redeem points' });
    }
};

