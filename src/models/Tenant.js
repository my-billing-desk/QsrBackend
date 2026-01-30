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
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
    },
    subscriptionPlan: {
        type: DataTypes.ENUM('starter', 'pro', 'enterprise'),
        defaultValue: 'starter'
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otpExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Multi-Tenancy Hierarchical Fields
    role: {
        type: DataTypes.STRING, // 'MASTER' or 'SUB'
        defaultValue: 'MASTER'
    },
    parentTenantId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Tenants',
            key: 'id'
        }
    },
    fssaiNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    royaltyPercentage: {
        type: DataTypes.FLOAT,
        defaultValue: 10.0
    }

});

module.exports = Tenant;
