const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UpsellReminder = sequelize.define('UpsellReminder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Banner title e.g., "Proceed with care!!"'
    },
    reminders: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'Array of reminder messages to display',
        defaultValue: []
    },
    displayLocation: {
        type: DataTypes.ENUM('cart', 'checkout', 'both'),
        defaultValue: 'cart',
        comment: 'Where to show this reminder'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    backgroundColor: {
        type: DataTypes.STRING,
        defaultValue: '#22c55e',
        comment: 'Hex color for banner background'
    },
    textColor: {
        type: DataTypes.STRING,
        defaultValue: '#ffffff',
        comment: 'Hex color for text'
    },
    highlightColor: {
        type: DataTypes.STRING,
        defaultValue: '#fbbf24',
        comment: 'Hex color for highlighted keywords'
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Display priority (higher = shown first)'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'upsell_reminders',
    timestamps: true,
    indexes: [
        { fields: ['tenantId'] },
        { fields: ['isActive'] },
        { fields: ['priority'] }
    ]
});

module.exports = UpsellReminder;
