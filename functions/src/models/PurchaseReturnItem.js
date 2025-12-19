const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseReturnItem = sequelize.define('PurchaseReturnItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchaseReturnId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rawMaterialId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    amount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    taxPercent: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
});

module.exports = PurchaseReturnItem;
