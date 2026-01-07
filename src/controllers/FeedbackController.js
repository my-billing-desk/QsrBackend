const { Feedback, Order, OrderItem, Customer, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

// 1. Submit Feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { orderId, customerId, overallRating, foodRating, serviceRating, ambianceRating, comment, itemFeedback, source } = req.body;

        const feedback = await Feedback.create({
            orderId,
            customerId,
            overallRating,
            foodRating,
            serviceRating,
            ambianceRating,
            comment,
            itemFeedback,
            source,
            tenantId: req.tenantId
        });

        // If overall rating is low (e.g., <= 2), we could trigger an alert here
        if (overallRating <= 2) {
            console.log(`ALERT: Low rating received for order #${orderId} on tenant ${req.tenantId}`);
            // In a real app, send SMS/Email/Push notification to manager
        }

        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
};

// 1.5 Lookup Order for Feedback
exports.lookupOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({
            where: { id: orderId },
            include: [{ model: OrderItem, as: 'items' }]
        });

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error looking up order:', error);
        res.status(500).json({ success: false, message: 'Failed to lookup order' });
    }
};


// 2. Get All Feedback
exports.getAllFeedback = async (req, res) => {
    try {
        const { status, rating, startDate, endDate } = req.query;
        let where = { tenantId: req.tenantId };

        if (status) where.status = status;
        if (rating) where.overallRating = rating;
        if (startDate && endDate) {
            where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }

        const feedbacks = await Feedback.findAll({
            where,
            include: [
                { model: Order, as: 'order', include: [{ model: OrderItem, as: 'items' }] },
                { model: Customer, as: 'customer' }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, data: feedbacks });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
    }
};

// 3. Get Feedback Analytics
exports.getFeedbackAnalytics = async (req, res) => {
    try {
        const tenantId = req.tenantId;

        // Overall Stats
        const stats = await Feedback.findAll({
            where: { tenantId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('overallRating')), 'avgOverall'],
                [sequelize.fn('AVG', sequelize.col('foodRating')), 'avgFood'],
                [sequelize.fn('AVG', sequelize.col('serviceRating')), 'avgService'],
                [sequelize.fn('AVG', sequelize.col('ambianceRating')), 'avgAmbiance'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalFeedback']
            ],
            raw: true
        });

        // Rating Distribution
        const distribution = await Feedback.findAll({
            where: { tenantId },
            attributes: ['overallRating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['overallRating'],
            raw: true
        });

        // Item-wise Performance (Simplified)
        // In a real scenario, we'd iterate through itemFeedback JSON or have a separate table
        const allFeedback = await Feedback.findAll({
            where: { tenantId, itemFeedback: { [Op.ne]: null } },
            attributes: ['itemFeedback'],
            raw: true
        });

        const itemStats = {};
        allFeedback.forEach(f => {
            const items = typeof f.itemFeedback === 'string' ? JSON.parse(f.itemFeedback) : f.itemFeedback;
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (!itemStats[item.itemId]) {
                        itemStats[item.itemId] = { totalRating: 0, count: 0, name: item.itemName || 'Unknown' };
                    }
                    itemStats[item.itemId].totalRating += item.rating;
                    itemStats[item.itemId].count += 1;
                });
            }
        });

        const topItems = Object.keys(itemStats).map(id => ({
            itemId: id,
            name: itemStats[id].name,
            avgRating: (itemStats[id].totalRating / itemStats[id].count).toFixed(1),
            count: itemStats[id].count
        })).sort((a, b) => b.avgRating - a.avgRating);

        res.json({
            success: true,
            data: {
                summary: stats[0],
                distribution,
                topItems: topItems.slice(0, 10),
                bottomItems: topItems.slice(-10).reverse()
            }
        });
    } catch (error) {
        console.error('Error fetching feedback analytics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedback analytics' });
    }
};

// 4. Update Feedback Status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const feedback = await Feedback.findOne({ where: { id, tenantId: req.tenantId } });
        if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

        await feedback.update({ status });
        res.json({ success: true, data: feedback });
    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};
