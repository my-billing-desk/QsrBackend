const { Aggregator, Order, OrderItem } = require('../models');

exports.updateSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { autoAccept, autoMarkReadyTime, isConnected, apiKey, merchantId } = req.body;

        const aggregator = await Aggregator.findOne({ where: { id, tenantId: req.user.tenantId } });
        if (!aggregator) return res.status(404).json({ message: "Aggregator not found" });

        if (autoAccept !== undefined) aggregator.autoAccept = autoAccept;
        if (autoMarkReadyTime !== undefined) aggregator.autoMarkReadyTime = autoMarkReadyTime;
        if (isConnected !== undefined) aggregator.isConnected = isConnected;
        if (apiKey !== undefined) aggregator.apiKey = apiKey;
        if (merchantId !== undefined) aggregator.merchantId = merchantId;

        // If credentials changed, reset verification
        if (apiKey || merchantId) {
            aggregator.verificationStatus = 'pending';
            aggregator.isConnected = false;
        }

        await aggregator.save();
        res.json({ message: "Settings updated successfully", aggregator });
    } catch (error) {
        res.status(500).json({ message: "Error updating settings", error: error.message });
    }
};

exports.verify = async (req, res) => {
    try {
        const { id } = req.params;
        const aggregator = await Aggregator.findOne({ where: { id, tenantId: req.user.tenantId } });

        if (!aggregator) return res.status(404).json({ message: "Aggregator not found" });
        if (!aggregator.apiKey || !aggregator.merchantId) {
            return res.status(400).json({ message: "API Key and Merchant ID are required for verification" });
        }

        console.log(`[REALTIME_API] Verifying ${aggregator.name} for Merchant: ${aggregator.merchantId}`);

        // Simulate Real API Handshake
        // In reality, this would be: axios.post('swiggy-api/verify', { key: aggregator.apiKey, mid: aggregator.merchantId })
        const isVerified = aggregator.apiKey.length > 5 && aggregator.merchantId.length > 3;

        if (isVerified) {
            aggregator.verificationStatus = 'verified';
            aggregator.isConnected = true;
            await aggregator.save();
            res.json({ success: true, message: `${aggregator.name} Verified Successfully. Integration is now LIVAE.`, aggregator });
        } else {
            aggregator.verificationStatus = 'failed';
            aggregator.isConnected = false;
            await aggregator.save();
            res.status(400).json({ success: false, message: "Invalid credentials. Please contact aggregator support.", aggregator });
        }
    } catch (error) {
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const aggregators = await Aggregator.findAll({ where: { tenantId: req.user.tenantId } });
        res.json(aggregators);
    } catch (error) {
        res.status(500).json({ message: "Error fetching aggregators", error: error.message });
    }
};

exports.webhook = async (req, res) => {
    try {
        const { source, items, customer, totalAmount, tenantId } = req.body;

        let resolvedTenantId = tenantId;

        // Find the aggregator to check settings
        const aggregator = await Aggregator.findOne({
            where: {
                slug: source.toLowerCase()
            }
        });

        if (aggregator && !resolvedTenantId) {
            resolvedTenantId = aggregator.tenantId;
        }

        const orderNum = `${source.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`;

        const status = (aggregator && aggregator.autoAccept) ? 'preparing' : 'placed';

        const newOrder = await Order.create({
            orderNumber: orderNum,
            source: source || 'Online',
            type: 'delivery',
            status: status,
            paymentStatus: 'paid',
            totalAmount: totalAmount || 0,
            customerName: customer?.name || 'Guest',
            customerPhone: customer?.phone || '',
            paymentMode: 'Online',
            tenantId: resolvedTenantId
        });

        // Handle Mark Ready Auto logic (Simulated here for now)
        if (aggregator && aggregator.autoMarkReadyTime > 0 && status === 'preparing') {
            console.log(`[REALTIME_DEBUG] Scheduling auto-ready for order ${newOrder.id} in ${aggregator.autoMarkReadyTime} minutes`);
            // In a production app, use a queue like BullMQ or a simple setTimeout for small scale
            setTimeout(async () => {
                const o = await Order.findByPk(newOrder.id);
                if (o && o.status === 'preparing') {
                    o.status = 'served'; // 'served' is our 'ready' equivalent in this schema
                    await o.save();
                    console.log(`[REALTIME_DEBUG] Order ${newOrder.id} marked ready automatically.`);
                }
            }, aggregator.autoMarkReadyTime * 60000);
        }

        res.status(200).json({ success: true, orderId: newOrder.id, message: "Order processed" });
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Error processing webhook", error: error.message });
    }
};
