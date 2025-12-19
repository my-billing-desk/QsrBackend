const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseItem = sequelize.define('PurchaseItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchaseId: {
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
        type: DataTypes.FLOAT, // Unit price
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT, // qty * price
        allowNull: false
    },
    taxPercent: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    cgstAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    sgstAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    igstAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
});

module.exports = PurchaseItem;
