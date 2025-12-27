const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wastage = sequelize.define('Wastage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, // 'Raw Material' or 'Item'
        defaultValue: 'Raw Material'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Pending'
    },
    totalAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
,
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = Wastage;
