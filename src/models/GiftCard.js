const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GiftCard = sequelize.define('GiftCard', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cardNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    pin: {
        type: DataTypes.STRING,
        allowNull: true
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    initialAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'expired', 'cancelled'),
        defaultValue: 'inactive'
    },
    type: {
        type: DataTypes.ENUM('physical', 'digital'),
        defaultValue: 'digital'
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = GiftCard;
