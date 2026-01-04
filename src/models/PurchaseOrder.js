const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    poNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    deliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    deliveryTime: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Pending' // Pending, Received, Cancelled
    },
    grandTotal: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
    ,
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = PurchaseOrder;
