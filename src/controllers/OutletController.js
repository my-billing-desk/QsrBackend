const { Outlet } = require('../models');

exports.getOutletConfig = async (req, res) => {
    try {
        if (!req.tenantId && req.user.role !== 'super_admin') return res.status(401).json({ success: false, message: 'Unauthorized' });

        const tenantId = req.tenantId || req.user.tenantId; // Handle super_admin case if needed, or just return empty/all?
        // Actually, super_admin might want to see ALL outlets or a specific one. 
        // For now, let's assume if no tenantId, we can't show outlet config unless we pass a query param?
        // But the error is 401 Unauthorized.

        if (!tenantId) {
            // If super admin has no tenant, try to fetch global config (tenantId: null)
            if (req.user.role === 'super_admin') {
                let outlet = await Outlet.findOne({ where: { tenantId: null } });
                return res.json({ success: true, data: outlet || {} });
            }
            return res.json({ success: true, data: {} });
        }

        // Get config for this tenant
        let outlet = await Outlet.findOne({ where: { tenantId } });
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
        const tenantId = req.tenantId || req.user.tenantId;
        if (!tenantId && req.user.role !== 'super_admin') return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { id, ...updateData } = req.body;
        // Ensure tenantId is set
        updateData.tenantId = tenantId;

        let outlet = await Outlet.findOne({ where: { tenantId } });

        if (outlet) {
            await outlet.update(updateData);
        } else {
            if (!updateData.name) updateData.name = 'Default Outlet';
            outlet = await Outlet.create(updateData);
        }

        res.json({ success: true, data: outlet, message: 'Outlet configuration updated' });
    } catch (error) {
        console.error('Error updating outlet config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
