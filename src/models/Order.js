const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('dine-in', 'takeaway', 'delivery'),
        defaultValue: 'dine-in'
    },
    status: {
        type: DataTypes.ENUM('placed', 'preparing', 'served', 'completed', 'cancelled'),
        defaultValue: 'placed'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'refunded'),
        defaultValue: 'pending'
    },
    totalAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    taxAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentMode: {
        type: DataTypes.STRING, // e.g., 'UPI', 'Cash', 'Card'
        defaultValue: 'Cash'
    },
    discount: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    roundOff: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    gstIn: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Order;
