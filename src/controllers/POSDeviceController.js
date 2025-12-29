const { POSDevice, Outlet } = require('../models');
const { Op } = require('sequelize');

// Register or update a POS device
exports.registerDevice = async (req, res) => {
    try {
        const {
            deviceId,
            deviceName,
            deviceType,
            platform,
            appVersion,
            ipAddress,
            macAddress,
            metadata
        } = req.body;

        const tenantId = req.user.tenantId;

        if (!deviceId || !deviceName) {
            return res.status(400).json({ error: 'deviceId and deviceName are required' });
        }

        // Check if device already exists
        const existingDevice = await POSDevice.findOne({
            where: { deviceId, tenantId }
        });

        if (existingDevice) {
            // Update existing device
            await existingDevice.update({
                deviceName,
                deviceType,
                platform,
                appVersion,
                ipAddress,
                macAddress,
                metadata,
                status: 'active',
                lastActiveAt: new Date()
            });

            return res.json({
                message: 'Device updated successfully',
                device: existingDevice
            });
        } else {
            // Create new device
            const newDevice = await POSDevice.create({
                deviceId,
                deviceName,
                deviceType,
                platform,
                appVersion,
                ipAddress,
                macAddress,
                metadata,
                tenantId,
                status: 'active',
                activatedAt: new Date(),
                lastActiveAt: new Date()
            });

            return res.status(201).json({
                message: 'Device registered successfully',
                device: newDevice
            });
        }
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({ error: 'Failed to register device' });
    }
};

// Update device heartbeat (last active timestamp)
exports.updateHeartbeat = async (req, res) => {
    try {
        const { deviceId } = req.body;
        const tenantId = req.user.tenantId;

        const device = await POSDevice.findOne({
            where: { deviceId, tenantId }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        await device.update({
            lastActiveAt: new Date(),
            status: 'active'
        });

        res.json({ message: 'Heartbeat updated', device });
    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
};

// Get all devices for a tenant
exports.getDevices = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const devices = await POSDevice.findAll({
            where: { tenantId },
            include: [
                {
                    model: Outlet,
                    required: false,
                    attributes: ['id', 'name', 'location']
                }
            ],
            order: [['lastActiveAt', 'DESC']]
        });

        // Calculate active vs inactive
        const now = new Date();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

        const devicesWithStatus = devices.map(device => {
            const isActive = device.lastActiveAt && device.lastActiveAt > fiveMinutesAgo;
            return {
                ...device.toJSON(),
                isOnline: isActive,
                status: isActive ? 'active' : 'offline'
            };
        });

        const activeCount = devicesWithStatus.filter(d => d.isOnline).length;

        res.json({
            total: devices.length,
            active: activeCount,
            inactive: devices.length - activeCount,
            devices: devicesWithStatus
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
};

// Get device statistics
exports.getDeviceStats = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const now = new Date();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

        const allDevices = await POSDevice.findAll({
            where: { tenantId }
        });

        const activeDevices = allDevices.filter(
            device => device.lastActiveAt && device.lastActiveAt > fiveMinutesAgo
        );

        res.json({
            total: allDevices.length,
            active: activeDevices.length,
            inactive: allDevices.length - activeDevices.length,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Error fetching device stats:', error);
        res.status(500).json({ error: 'Failed to fetch device stats' });
    }
};

// Deactivate a device
exports.deactivateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const device = await POSDevice.findOne({
            where: { id, tenantId }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        await device.update({ status: 'inactive' });

        res.json({ message: 'Device deactivated successfully', device });
    } catch (error) {
        console.error('Error deactivating device:', error);
        res.status(500).json({ error: 'Failed to deactivate device' });
    }
};

module.exports = exports;
