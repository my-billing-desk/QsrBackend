const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const POSDevice = sequelize.define('POSDevice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the device (MAC address, UUID, etc.)'
    },
    deviceName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Friendly name for the device'
    },
    deviceType: {
        type: DataTypes.ENUM('desktop', 'tablet', 'mobile'),
        defaultValue: 'desktop',
        comment: 'Type of device running the POS'
    },
    platform: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Operating system (Windows, macOS, Linux, Android, iOS)'
    },
    appVersion: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Version of the POS application'
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'IP address of the device'
    },
    macAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'MAC address of the device'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'offline'),
        defaultValue: 'active',
        comment: 'Current status of the device'
    },
    lastActiveAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last time the device was active'
    },
    activatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the device was first activated'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional device information (screen resolution, memory, etc.)'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to the tenant/outlet'
    },
    outletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to specific outlet if multi-outlet setup'
    }
}, {
    tableName: 'pos_devices',
    timestamps: true
});

module.exports = POSDevice;
