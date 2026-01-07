const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    birthday: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    anniversary: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    totalSpend: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    totalOrders: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastVisit: {
        type: DataTypes.DATE,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = Customer;
