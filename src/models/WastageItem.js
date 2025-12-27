const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WastageItem = sequelize.define('WastageItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    wastageId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rawMaterialId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    quantity: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    price: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    amount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
,
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = WastageItem;
