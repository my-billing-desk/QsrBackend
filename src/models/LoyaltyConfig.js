const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyConfig = sequelize.define('LoyaltyConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    programType: {
        type: DataTypes.ENUM('points', 'visit', 'tiered', 'cashback', 'stamp'),
        defaultValue: 'points'
    },
    pointsPerRupee: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0 // 1 point for every 1 rupee
    },
    minRedemptionPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    pointExpiryDays: {
        type: DataTypes.INTEGER,
        defaultValue: 365
    },
    cashbackPercentage: {
        type: DataTypes.FLOAT,
        defaultValue: 5.0 // 5% cashback
    },
    stampsToReward: {
        type: DataTypes.INTEGER,
        defaultValue: 10 // Reward after 10 stamps
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

module.exports = LoyaltyConfig;
