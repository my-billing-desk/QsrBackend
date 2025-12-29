const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subdomain: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'trial', 'onboard_pending'),
        defaultValue: 'active'
    },
    subscriptionPlan: {
        type: DataTypes.ENUM('starter', 'pro', 'enterprise'),
        defaultValue: 'starter'
    },
    subscriptionExpiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = Tenant;
