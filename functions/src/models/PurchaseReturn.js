const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseReturn = sequelize.define('PurchaseReturn', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    debitNoteNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    debitNoteDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    purchaseInvoiceNumber: { // Reference to original invoice
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Pending'
    },
    grandTotal: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = PurchaseReturn;
