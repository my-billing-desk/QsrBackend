const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerLoyalty = sequelize.define('CustomerLoyalty', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    currentPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lifetimePoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    walletBalance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    currentStamps: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    visitCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    tierId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = CustomerLoyalty;
