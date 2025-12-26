const { Setting } = require('../models');

exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll({ where: { tenantId: req.tenantId } });
        // Convert to object for easier consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Provide defaults if not set
        const defaults = {
            'gst_mode': 'exclusive', // 'inclusive' or 'exclusive' (backward/forward)
            'gst_percentage': '5',
            'shifts_enabled': 'false',
            'open_tickets_enabled': 'false',
            'kitchen_printers_enabled': 'false',
            'customer_displays_enabled': 'false',
            'dining_options_enabled': 'false',
            'low_stock_notifications_enabled': 'false',
            'negative_stock_alerts_enabled': 'false'
        };

        res.json({ ...defaults, ...settingsMap });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expecting { key: value, key2: value2 }

        for (const [key, value] of Object.entries(updates)) {
            const [setting, created] = await Setting.findOrCreate({
                where: { key, tenantId: req.tenantId },
                defaults: { value: String(value), tenantId: req.tenantId }
            });

            if (!created) {
                await setting.update({ value: String(value) });
            }
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
