const { Setting } = require('../models');

exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll();
        // Convert to object for easier consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Provide defaults if not set
        const defaults = {
            'gst_mode': 'exclusive', // 'inclusive' or 'exclusive' (backward/forward)
            'gst_percentage': '5'
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
                where: { key },
                defaults: { value: String(value) }
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
