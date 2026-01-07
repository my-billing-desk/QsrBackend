const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoyaltyTier = sequelize.define('LoyaltyTier', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING, // Silver, Gold, Platinum
        allowNull: false
    },
    minPoints: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    multiplier: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0 // Multiplier for points earned
    },
    benefits: {
        type: DataTypes.TEXT, // JSON string of benefits
        allowNull: true
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#C0C0C0'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = LoyaltyTier;
