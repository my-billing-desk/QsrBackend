const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAlert = sequelize.define('StockAlert', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rawMaterialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Raw material that triggered alert'
    },
    alertType: {
        type: DataTypes.ENUM('low_stock', 'out_of_stock', 'expired', 'expiring_soon'),
        allowNull: false,
        defaultValue: 'low_stock'
    },
    currentStock: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Stock level when alert was triggered'
    },
    minimumStock: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        comment: 'Minimum stock level for reference'
    },
    status: {
        type: DataTypes.ENUM('active', 'resolved', 'ignored'),
        allowNull: false,
        defaultValue: 'active'
    },
    resolvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who resolved the alert'
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'stock_alerts',
    timestamps: true,
    indexes: [
        { fields: ['rawMaterialId'] },
        { fields: ['status'] },
        { fields: ['tenantId'] },
        { fields: ['alertType'] }
    ]
});

module.exports = StockAlert;
