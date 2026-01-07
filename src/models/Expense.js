const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExpenseCategory = sequelize.define('ExpenseCategory', {
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

const Expense = sequelize.define('Expense', {
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
    reason: {
        type: DataTypes.STRING, // Could be linked to Category, but UI shows dropdown. Let's store string or ID.
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    explanation: {
        type: DataTypes.TEXT
    },
    employee: {
        type: DataTypes.STRING
    },
    paidFrom: {
        type: DataTypes.STRING, // 'Cash', 'Bank'
        defaultValue: 'Cash'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = { Expense, ExpenseCategory };
