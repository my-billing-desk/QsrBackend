const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SplitPayment = sequelize.define('SplitPayment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to the order being split'
    },
    splitType: {
        type: DataTypes.ENUM('item', 'seat', 'equal'),
        allowNull: false,
        comment: 'Type of split: by item, by seat number, or equally'
    },
    totalSplits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Number of ways the bill is split'
    },
    originalTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Original total amount before split'
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional split configuration (seat assignments, etc.)'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who created the split'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'split_payments',
    timestamps: true,
    indexes: [
        { fields: ['orderId'] },
        { fields: ['status'] },
        { fields: ['tenantId'] }
    ]
});

module.exports = SplitPayment;
