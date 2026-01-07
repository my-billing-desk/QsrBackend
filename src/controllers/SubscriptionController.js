const { Subscription } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const subscriptions = await Subscription.findAll({ where: { tenantId: req.tenantId } });
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching subscriptions", error });
    }
};

exports.buy = async (req, res) => {
    try {
        const { slug } = req.body;
        const sub = await Subscription.findOne({ where: { slug, tenantId: req.tenantId } });

        if (sub) {
            sub.status = 'active';
            // Set expiry to 1 year from now
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 1);
            sub.expiryDate = expiry;
            await sub.save();
            res.json({ success: true, message: "Subscription activated", subscription: sub });
        } else {
            res.status(404).json({ message: "Service not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error purchasing subscription", error });
    }
};
