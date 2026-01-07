const OndcSecurity = require('../utils/ondcSecurity');
const { getOndcInstance } = require('../utils/ondcHelper');
const { Aggregator, Item, Category } = require('../models');
const axios = require('axios');

exports.search = async (req, res) => {
    try {
        console.log("ONDC Search Received:", JSON.stringify(req.body, null, 2));

        // 1. Acknowledge the request immediately as per Beckn protocol
        res.status(200).json({
            message: { ack: { status: "ACK" } }
        });

        // 2. Determine tenantId (In production, lookup via subscriber_id in registry or req path)
        const tenantId = req.tenantId || 1; // Fallback for demo

        // 3. Process search asynchronously
        setImmediate(async () => {
            try {
                const { context, message } = req.body;
                const searchCriteria = message.intent?.item?.descriptor?.name || "";

                // Find matching items from our DB
                const items = await Item.findAll({
                    where: { tenantId, availableOndc: true },
                    include: [{ model: Category }]
                });

                // Get tenant's ONDC keys for signing
                const agg = await Aggregator.findOne({ where: { slug: 'ondc', tenantId } });
                if (!agg || !agg.privateKey) {
                    console.error("ONDC Keys not configured for tenant", tenantId);
                    return;
                }

                // 4. Compose on_search message
                const onSearchPayload = {
                    context: {
                        ...context,
                        action: "on_search",
                        bpp_id: agg.subscriberId,
                        bpp_uri: agg.bppUri,
                        timestamp: new Date().toISOString()
                    },
                    message: {
                        catalog: {
                            "bpp/descriptor": {
                                name: "SmartQSR POS",
                                symbol: "https://smartqsr.com/logo.png"
                            },
                            "bpp/providers": [{
                                id: `P-${tenantId}`,
                                descriptor: { name: agg.merchantId || "SmartQSR Outlet" },
                                categories: items.reduce((acc, it) => {
                                    if (!acc.find(c => c.id === it.CategoryId?.toString())) {
                                        acc.push({ id: it.CategoryId?.toString(), descriptor: { name: it.Category?.name } });
                                    }
                                    return acc;
                                }, []),
                                items: items.map(item => ({
                                    id: item.id.toString(),
                                    descriptor: {
                                        name: item.name,
                                        symbol: item.image,
                                        short_desc: item.description || item.name
                                    },
                                    price: { currency: "INR", value: item.price.toString() },
                                    category_id: item.CategoryId?.toString(),
                                    tags: [
                                        {
                                            code: "veg_nonveg",
                                            list: [{ code: item.isVeg ? "veg" : "non_veg", value: "yes" }]
                                        }
                                    ]
                                }))
                            }]
                        }
                    }
                };

                // 5. Sign the payload using the tenant's Private Key
                const { signingString, created, expires } = await OndcSecurity.createSigningString(onSearchPayload);
                const signature = await OndcSecurity.signMessage(signingString, agg.privateKey);
                const authHeader = OndcSecurity.generateAuthHeader(agg.subscriberId, agg.ukId, signature, created, expires);

                // 6. Push to BAP's on_search URI
                await axios.post(`${context.bap_uri}/on_search`, onSearchPayload, {
                    headers: { 'Authorization': authHeader }
                });

                console.log("ONDC on_search pushed successfully");
            } catch (err) {
                console.error("Error in on_search background process:", err);
            }
        });

    } catch (error) {
        console.error("ONDC Search Route Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.select = async (req, res) => {
    try {
        console.log("ONDC Select Received:", JSON.stringify(req.body, null, 2));
        res.status(200).json({ message: { ack: { status: "ACK" } } });

        const tenantId = req.tenantId || 1;
        setImmediate(async () => {
            try {
                const { context, message } = req.body;
                const orderItems = message.order.items;

                const dbItems = await Item.findAll({
                    where: { id: orderItems.map(i => i.id), tenantId }
                });

                const agg = await Aggregator.findOne({ where: { slug: 'ondc', tenantId } });
                if (!agg || !agg.privateKey) {
                    console.error("ONDC Keys not configured for tenant", tenantId);
                    return;
                }

                let totalValue = 0;
                const quoteItems = dbItems.map(item => {
                    const price = item.price;
                    totalValue += price;
                    return {
                        "@ondc/org/item_id": item.id.toString(),
                        "@ondc/org/item_quantity": { count: 1 },
                        title: item.name,
                        price: { currency: "INR", value: price.toString() }
                    };
                });

                const onSelectPayload = {
                    context: { ...context, action: "on_select", timestamp: new Date().toISOString() },
                    message: {
                        order: {
                            provider: message.order.provider,
                            items: orderItems,
                            quote: {
                                price: { currency: "INR", value: totalValue.toString() },
                                break_up: quoteItems,
                                ttl: "P1D"
                            }
                        }
                    }
                };

                const { signingString, created, expires } = await OndcSecurity.createSigningString(onSelectPayload);
                const signature = await OndcSecurity.signMessage(signingString, agg.privateKey);
                const authHeader = OndcSecurity.generateAuthHeader(agg.subscriberId, agg.ukId, signature, created, expires);

                await axios.post(`${context.bap_uri}/on_select`, onSelectPayload, { headers: { 'Authorization': authHeader } });
                console.log("ONDC on_select pushed successfully");
            } catch (err) { console.error("ONDC on_select error:", err); }
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.init = async (req, res) => {
    try {
        console.log("ONDC Init Received:", JSON.stringify(req.body, null, 2));
        res.status(200).json({ message: { ack: { status: "ACK" } } });

        const tenantId = req.tenantId || 1;
        setImmediate(async () => {
            try {
                const { context, message } = req.body;
                const agg = await Aggregator.findOne({ where: { slug: 'ondc', tenantId } });
                if (!agg || !agg.privateKey) {
                    console.error("ONDC Keys not configured for tenant", tenantId);
                    return;
                }

                const onInitPayload = {
                    context: { ...context, action: "on_init", timestamp: new Date().toISOString() },
                    message: {
                        order: {
                            ...message.order,
                            payment: {
                                type: "ON-ORDER",
                                status: "NOT-PAID",
                                collecting_model: "BAP"
                            }
                        }
                    }
                };

                const { signingString, created, expires } = await OndcSecurity.createSigningString(onInitPayload);
                const signature = await OndcSecurity.signMessage(signingString, agg.privateKey);
                const authHeader = OndcSecurity.generateAuthHeader(agg.subscriberId, agg.ukId, signature, created, expires);

                await axios.post(`${context.bap_uri}/on_init`, onInitPayload, { headers: { 'Authorization': authHeader } });
                console.log("ONDC on_init pushed successfully");
            } catch (err) { console.error("ONDC on_init error:", err); }
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.confirm = async (req, res) => {
    try {
        console.log("ONDC Confirm Received:", JSON.stringify(req.body, null, 2));
        res.status(200).json({ message: { ack: { status: "ACK" } } });

        const tenantId = req.tenantId || 1;
        setImmediate(async () => {
            try {
                const { context, message } = req.body;
                const agg = await Aggregator.findOne({ where: { slug: 'ondc', tenantId } });
                const { Order, OrderItem } = require('../models');

                // Create Order in POS DB
                const newOrder = await Order.create({
                    tenantId,
                    orderNumber: `ONDC-${Date.now()}`,
                    totalAmount: parseFloat(message.order.quote.price.value),
                    status: 'placed',
                    source: 'ONDC',
                    customerName: message.order.billing?.name || "ONDC Customer",
                    type: 'delivery'
                });

                // Create Order Items
                for (const item of message.order.items) {
                    await OrderItem.create({
                        orderId: newOrder.id,
                        itemId: parseInt(item.id),
                        quantity: item.quantity?.count || 1,
                        price: parseFloat(item.price?.value || 0)
                    });
                }

                const onConfirmPayload = {
                    context: { ...context, action: "on_confirm", timestamp: new Date().toISOString() },
                    message: {
                        order: {
                            ...message.order,
                            state: "Accepted",
                            id: newOrder.id.toString()
                        }
                    }
                };

                const { signingString, created, expires } = await OndcSecurity.createSigningString(onConfirmPayload);
                const signature = await OndcSecurity.signMessage(signingString, agg.privateKey);
                const authHeader = OndcSecurity.generateAuthHeader(agg.subscriberId, agg.ukId, signature, created, expires);

                await axios.post(`${context.bap_uri}/on_confirm`, onConfirmPayload, { headers: { 'Authorization': authHeader } });
                console.log("ONDC on_confirm pushed successfully");
            } catch (err) { console.error("ONDC on_confirm error:", err); }
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.status = async (req, res) => { res.status(200).json({ message: { ack: { status: "ACK" } } }); };
exports.update = async (req, res) => { res.status(200).json({ message: { ack: { status: "ACK" } } }); };
exports.track = async (req, res) => { res.status(200).json({ message: { ack: { status: "ACK" } } }); };
exports.cancel = async (req, res) => { res.status(200).json({ message: { ack: { status: "ACK" } } }); };

exports.getConfig = async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { key: 'ondc_config', tenantId: req.tenantId } });
        res.json(setting ? JSON.parse(setting.value) : {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateConfig = async (req, res) => {
    try {
        const { config } = req.body;
        let setting = await Setting.findOne({ where: { key: 'ondc_config', tenantId: req.tenantId } });

        if (setting) {
            await setting.update({ value: JSON.stringify(config) });
        } else {
            await Setting.create({
                key: 'ondc_config',
                value: JSON.stringify(config),
                tenantId: req.tenantId
            });
        }

        res.json({ success: true, message: "ONDC configuration updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
