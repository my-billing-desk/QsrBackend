const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashTopUpCategory = sequelize.define('CashTopUpCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

const CashTopUp = sequelize.define('CashTopUp', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    explanation: {
        type: DataTypes.TEXT
    },
    receivedFrom: {
        type: DataTypes.STRING
    },
    receivedTo: {
        type: DataTypes.STRING
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = { CashTopUp, CashTopUpCategory };
