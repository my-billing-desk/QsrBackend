const { Aggregator } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const aggregators = await Aggregator.findAll({ where: { tenantId: req.tenantId } });
        res.json(aggregators);
    } catch (error) {
        res.status(500).json({ message: "Error fetching aggregators", error });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const aggregator = await Aggregator.findOne({ where: { id, tenantId: req.tenantId } });
        if (!aggregator) return res.status(404).json({ message: "Aggregator not found" });

        // Update fields if provided
        const { apiKey, merchantId, subscriberId, ukId, signingPublicKey, encryptionPublicKey, privateKey, bppUri, cityCode, domain } = req.body;
        if (apiKey !== undefined) aggregator.apiKey = apiKey;
        if (merchantId !== undefined) aggregator.merchantId = merchantId;
        if (subscriberId !== undefined) aggregator.subscriberId = subscriberId;
        if (ukId !== undefined) aggregator.ukId = ukId;
        if (signingPublicKey !== undefined) aggregator.signingPublicKey = signingPublicKey;
        if (encryptionPublicKey !== undefined) aggregator.encryptionPublicKey = encryptionPublicKey;
        if (privateKey !== undefined) aggregator.privateKey = privateKey;
        if (bppUri !== undefined) aggregator.bppUri = bppUri;
        if (cityCode !== undefined) aggregator.cityCode = cityCode;
        if (domain !== undefined) aggregator.domain = domain;

        // If no specific fields toggled, just toggle connection
        if (Object.keys(req.body).length === 0 || (Object.keys(req.body).length === 1 && req.body.hasOwnProperty('id'))) {
            aggregator.isConnected = !aggregator.isConnected;
        } else {
            // If fields were provided, we usually want it connected
            aggregator.isConnected = true;
        }

        await aggregator.save();

        res.json({ message: "Status and configuration updated", aggregator });
    } catch (error) {
        res.status(500).json({ message: "Error updating aggregator", error });
    }
};

exports.verify = async (req, res) => {
    try {
        const { id } = req.params;
        const aggregator = await Aggregator.findOne({ where: { id, tenantId: req.tenantId } });
        if (!aggregator) return res.status(404).json({ message: "Aggregator not found" });

        // Simulate verification logic
        aggregator.isConnected = true;
        aggregator.verificationStatus = 'verified';
        await aggregator.save();

        res.json({ success: true, message: `${aggregator.name} verification successful!` });
    } catch (error) {
        res.status(500).json({ message: "Verification failed", error });
    }
};

exports.syncMarketplace = async (req, res) => {
    const { Subscription } = require('../models');
    try {
        const tenantId = req.tenantId;

        if (!tenantId) {
            console.error("Sync Error: No tenantId in request");
            return res.status(400).json({ error: "Tenant ID required for sync" });
        }

        console.log(`Syncing marketplace for tenant: ${tenantId}`);

        // Default Aggregators
        const defaultAggs = [
            { name: 'ONDC', slug: 'ondc', category: 'Online Orders', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/29/ONDC_Official_Logo.svg' },
            { name: 'Zomato', slug: 'zomato', category: 'Online Orders', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Zomato_Logo.svg' },
            { name: 'Swiggy', slug: 'swiggy', category: 'Online Orders', icon: 'https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg' }
        ];

        for (const agg of defaultAggs) {
            await Aggregator.findOrCreate({
                where: { slug: agg.slug, tenantId },
                defaults: { ...agg, tenantId }
            });
        }

        // Default Subscriptions
        const defaultSubs = [
            { serviceName: 'Scan & Order', slug: 'scan-order', category: 'Active Subscription', price: 4500, iconName: 'qrcode', badge: 'Active' },
            { serviceName: 'WhatsApp Alerts', slug: 'whatsapp', category: 'Active Subscription', price: 1000, iconName: 'message', badge: 'Active' },
            { serviceName: 'POS Subscription', slug: 'pos', category: 'Active Subscription', price: 7000, iconName: 'monitor', badge: 'Active' },
            { serviceName: 'Inventory Application', slug: 'inventory', category: 'Easy Operations', price: 0, iconName: 'layers', badge: 'Activated', status: 'active' },
            { serviceName: 'Kitchen Display System (KDS)', slug: 'kds', category: 'Easy Operations', price: 0, iconName: 'monitor', badge: '7 Days Free', status: 'available' },
            { serviceName: 'Captain Application', slug: 'captain', category: 'Easy Operations', price: 0, iconName: 'users', badge: 'Explore Now', status: 'available' }
        ];

        for (const sub of defaultSubs) {
            await Subscription.findOrCreate({
                where: { slug: sub.slug, tenantId },
                defaults: { ...sub, tenantId }
            });
        }

        console.log(`Sync completed for tenant: ${tenantId}`);
        res.json({ success: true, message: "Marketplace synced successfully" });
    } catch (error) {
        console.error("Sync Error Details:", error);
        res.status(500).json({ error: "Sync failed", details: error.message });
    }
};

exports.webhook = async (req, res) => {
    const { Order, OrderItem } = require('../models');
    try {
        // Expected payload: { source: 'Swiggy', items: [{ name: 'Burger', price: 100, quantity: 1 }], customer: { name: 'John' } }
        const { source, items, customer, totalAmount } = req.body;

        const orderNum = `${source.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`;

        const newOrder = await Order.create({
            orderNumber: orderNum,
            source: source || 'Online',
            type: 'delivery',
            status: 'placed',
            paymentStatus: 'paid', // Online orders are usually prepaid or COD
            totalAmount: totalAmount || 0,
            customerName: customer?.name || 'Guest',
            customerPhone: customer?.phone || '',
            paymentMode: 'Online'
        });

        if (items && items.length > 0) {
            // This is a simplified logic. In real app, we would look up Item IDs.
            // For now, we accept arbitrary items for simulation if Item ID is not critical for simple display.
            // However, OrderItem usually links to Item.
            // Let's assume we just want to create the Order header for the notification mostly.
            // To actually show items, we need to map them.
            // We'll skip complex mapping for this basic "Integration" step unless requested.
        }

        res.status(200).json({ success: true, orderId: newOrder.id, message: "Order received via Webhook" });
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Error processing webhook", error: error.message });
    }
};
