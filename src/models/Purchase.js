const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('Purchase', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    invoiceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    poNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Unpaid' // Paid, Unpaid, Partial
    },
    paymentType: {
        type: DataTypes.STRING, // Cash, Card, UPI, etc.
        allowNull: true
    },
    // Amounts
    subTotal: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    discount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    otherCharges: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    grandTotal: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    // Taxes
    totalCgst: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    totalSgst: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    totalIgst: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = Purchase;
