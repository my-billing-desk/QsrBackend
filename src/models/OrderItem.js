const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    itemName: { // Snapshot in case item changes
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    price: { // Snapshot price
        type: DataTypes.FLOAT,
        allowNull: false
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    variantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    variantName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    addons: {
        type: DataTypes.JSON, // Stores array of addon objects
        allowNull: true
    },
    specialNote: {
        type: DataTypes.STRING,
        allowNull: true
    }
    ,
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = OrderItem;
