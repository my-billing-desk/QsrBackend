const { Outlet } = require('../models');

exports.getOutletConfig = async (req, res) => {
    try {
        if (!req.tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Get config for this tenant
        let outlet = await Outlet.findOne({ where: { tenantId: req.tenantId } });
        if (!outlet) {
            // Return empty object if not initialized
            return res.json({ success: true, data: {} });
        }
        res.json({ success: true, data: outlet });
    } catch (error) {
        console.error('Error fetching outlet config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateOutletConfig = async (req, res) => {
    try {
        if (!req.tenantId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { id, ...updateData } = req.body;
        // Ensure tenantId is set
        updateData.tenantId = req.tenantId;

        let outlet = await Outlet.findOne({ where: { tenantId: req.tenantId } });

        if (outlet) {
            await outlet.update(updateData);
        } else {
            // Provide default name if missing during creation
            if (!updateData.name) updateData.name = 'New Outlet';
            outlet = await Outlet.create(updateData);
        }

        res.json({ success: true, data: outlet, message: 'Outlet configuration updated' });
    } catch (error) {
        console.error('Error updating outlet config:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
