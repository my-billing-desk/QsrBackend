const { PosDevice } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const devices = await PosDevice.findAll({
            where: { tenantId: req.user.tenantId }
        });
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await PosDevice.count({ where: { tenantId: req.user.tenantId } });
        const active = await PosDevice.count({ where: { tenantId: req.user.tenantId, status: 'active' } });
        res.json({ total, active });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, code } = req.body;
        const device = await PosDevice.create({
            name,
            code,
            tenantId: req.user.tenantId
        });
        res.status(201).json(device);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.heartbeat = async (req, res) => {
    try {
        const { code } = req.body;
        const device = await PosDevice.findOne({
            where: { code, tenantId: req.user.tenantId }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        device.lastHeartbeat = new Date();
        device.status = 'active';
        await device.save();

        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deactivate = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await PosDevice.findOne({
            where: { id, tenantId: req.user.tenantId }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        device.status = 'inactive';
        await device.save();

        res.json(device);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
