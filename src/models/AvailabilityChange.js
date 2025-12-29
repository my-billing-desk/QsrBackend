const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AvailabilityChange = sequelize.define('AvailabilityChange', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Item that was 86ed or brought back'
    },
    variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Variant that was 86ed (if applicable)'
    },
    changeType: {
        type: DataTypes.ENUM('86', 'back_in_stock'),
        allowNull: false,
        comment: '86 = marked unavailable, back_in_stock = available again'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Reason for change (out of stock, quality issue, etc.)'
    },
    estimatedBackTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When item is expected to be available again'
    },
    changedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User who made the change'
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Device where change was made (kitchen display, POS, etc.)'
    },
    syncedToAggregators: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether change was synced to external platforms'
    },
    syncErrors: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Errors from syncing to external APIs'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'availability_changes',
    timestamps: true,
    indexes: [
        { fields: ['itemId'] },
        { fields: ['variantId'] },
        { fields: ['changeType'] },
        { fields: ['tenantId'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = AvailabilityChange;
