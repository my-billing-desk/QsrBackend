const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashMovement = sequelize.define('CashMovement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('cash_in', 'cash_out'),
        allowNull: false,
        comment: 'Type of cash movement: cash_in (adding money) or cash_out (removing money)'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Amount of cash moved'
    },
    reason: {
        type: DataTypes.ENUM(
            'opening_float',
            'adding_change',
            'correction',
            'petty_cash',
            'supplier_payment',
            'cash_drop',
            'staff_tips',
            'other'
        ),
        allowNull: false,
        comment: 'Reason for the cash movement'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional notes or description'
    },
    referenceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional reference number (receipt, invoice, etc.)'
    },
    performedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'User ID who performed the cash movement'
    },
    approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID who approved the movement (if required)'
    },
    shiftId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Associated shift ID'
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Device/Till where the movement occurred'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to the tenant'
    },
    outletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to outlet if multi-outlet setup'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional metadata (denominations, etc.)'
    }
}, {
    tableName: 'cash_movements',
    timestamps: true,
    indexes: [
        {
            fields: ['tenantId']
        },
        {
            fields: ['type']
        },
        {
            fields: ['performedBy']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = CashMovement;
