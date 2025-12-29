const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockTransaction = sequelize.define('StockTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('order', 'waste', 'adjustment', 'purchase', 'return'),
        allowNull: false,
        comment: 'Type of stock movement'
    },
    rawMaterialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to raw material'
    },
    quantityChange: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Quantity added (positive) or removed (negative)'
    },
    currentStock: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Stock level after this transaction'
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Related order ID if type is order'
    },
    purchaseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Related purchase ID if type is purchase'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional notes'
    },
    performedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who performed the transaction'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Restaurant/tenant reference'
    }
}, {
    tableName: 'stock_transactions',
    timestamps: true,
    indexes: [
        { fields: ['rawMaterialId'] },
        { fields: ['orderId'] },
        { fields: ['type'] },
        { fields: ['tenantId'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = StockTransaction;
