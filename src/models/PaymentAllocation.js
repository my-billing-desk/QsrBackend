const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentAllocation = sequelize.define('PaymentAllocation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    splitPaymentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to parent split payment'
    },
    splitNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Which split this is (1, 2, 3, etc.)'
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Subtotal before tax for this split'
    },
    taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Tax amount for this split'
    },
    tipAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Tip amount for this split'
    },
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Discount applied to this split'
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Final total amount for this split'
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'partial', 'cancelled'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'How this split was paid (cash, card, etc.)'
    },
    paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Amount actually paid'
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    orderItemIds: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of order item IDs in this split'
    },
    seatNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Seat number if split by seat'
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional customer name for this split'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'payment_allocations',
    timestamps: true,
    indexes: [
        { fields: ['orderId'] },
        { fields: ['splitPaymentId'] },
        { fields: ['status'] },
        { fields: ['tenantId'] }
    ]
});

module.exports = PaymentAllocation;
