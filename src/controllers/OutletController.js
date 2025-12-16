const { Outlet } = require('../models');

exports.getOutletConfig = async (req, res) => {
    try {
        // Assuming single outlet for now, get the first one
        let outlet = await Outlet.findOne();
        if (!outlet) {
            // Return empty object or default structure if not initialized
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
        const { id, ...updateData } = req.body;
        let outlet;

        if (id) {
            outlet = await Outlet.findByPk(id);
        } else {
            // Try enabling findOne if no ID but exists
            outlet = await Outlet.findOne();
        }

        if (outlet) {
            await outlet.update(updateData);
        } else {
            outlet = await Outlet.create(updateData);
        }

        res.json({ success: true, data: outlet, message: 'Outlet configuration updated' });
    } catch (error) {
        console.error('Error updating outlet config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
