const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Coupon code e.g., SUBWAY, Get200OffOn399'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Display name e.g., "Meal 6@99"'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    source: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'CRM source e.g., "Subway", "Xeno", "Open Discount"'
    },
    discountType: {
        type: DataTypes.ENUM('percentage', 'fixed', 'item_specific'),
        defaultValue: 'fixed',
        comment: 'Type of discount'
    },
    discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Percentage (e.g., 20) or Fixed amount (e.g., 200)'
    },
    minOrderAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Minimum order value required'
    },
    maxDiscountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum discount cap (for percentage type)'
    },
    validFrom: {
        type: DataTypes.DATE,
        allowNull: false
    },
    validUntil: {
        type: DataTypes.DATE,
        allowNull: false
    },
    usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of times used'
    },
    maxUsage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Max total usage limit'
    },
    usagePerCustomer: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Max usage per customer'
    },
    applicableStores: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of store IDs where valid'
    },
    applicableItems: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of item IDs for item-specific coupons'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    errorMessage: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Custom error message to show customer'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'coupons',
    timestamps: true,
    indexes: [
        { fields: ['code'], unique: true },
        { fields: ['tenantId'] },
        { fields: ['source'] },
        { fields: ['isActive'] },
        { fields: ['validFrom', 'validUntil'] }
    ]
});

module.exports = Coupon;
