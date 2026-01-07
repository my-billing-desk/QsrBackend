const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    serviceName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING, // e.g. 'POS Plans', 'Easy Operations'
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'expired', 'pending', 'available'),
        defaultValue: 'available'
    },
    price: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    iconName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    badge: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = Subscription;
