const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyReward = sequelize.define('LoyaltyReward', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rewardType: {
        type: DataTypes.ENUM('discount_percent', 'discount_fixed', 'free_item', 'cashback'),
        allowNull: false
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    pointsRequired: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    stampsRequired: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    minOrderAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = LoyaltyReward;
