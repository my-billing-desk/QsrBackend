const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GiftCardTransaction = sequelize.define('GiftCardTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    giftCardId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('activation', 'redemption', 'reload', 'refund', 'cancellation'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = GiftCardTransaction;
