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
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false // e.g., 'zomato', 'swiggy'
    },
    isConnected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: true
    },
    merchantId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subscriberId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ukId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    signingPublicKey: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    encryptionPublicKey: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    privateKey: {
        type: DataTypes.TEXT,
        allowNull: true // Should be handled securely
    },
    bppUri: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cityCode: {
        type: DataTypes.STRING,
        defaultValue: 'std:080'
    },
    domain: {
        type: DataTypes.STRING,
        defaultValue: 'RET11'
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'Online Orders'
    },
    requestStatus: {
        type: DataTypes.ENUM('none', 'received', 'menu_updated', 'qc_done', 'initiated', 'live'),
        defaultValue: 'none'
    },
    verificationStatus: {
        type: DataTypes.ENUM('none', 'pending', 'verified', 'failed'),
        defaultValue: 'none'
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING, // e.g., URL or identifier
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = Aggregator;
