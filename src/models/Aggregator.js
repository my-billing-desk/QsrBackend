const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Aggregator = sequelize.define('Aggregator', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false, // e.g., 'zomato', 'swiggy'
        unique: true
    },
    isConnected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING, // e.g., URL or identifier
        allowNull: true
    },
    autoAccept: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    autoMarkReadyTime: {
        type: DataTypes.INTEGER, // in minutes, 0 means disabled
        defaultValue: 0
    },
    verificationStatus: {
        type: DataTypes.ENUM('pending', 'verified', 'failed', 'none'),
        defaultValue: 'none'
    },
    merchantId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = Aggregator;
