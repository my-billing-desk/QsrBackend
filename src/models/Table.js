const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Table = sequelize.define('Table', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    number: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Table number or name (T1, T2, VIP1, etc.)'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional friendly name'
    },
    floorPlanId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to floor plan'
    },
    positionX: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'X coordinate on floor plan'
    },
    positionY: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Y coordinate on floor plan'
    },
    shape: {
        type: DataTypes.ENUM('circle', 'rectangle', 'square', 'oval'),
        defaultValue: 'circle',
        comment: 'Visual shape on floor plan'
    },
    capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 4,
        comment: 'Maximum number of guests'
    },
    status: {
        type: DataTypes.ENUM('available', 'seated', 'ordering', 'eating', 'paying', 'cleaning'),
        defaultValue: 'available',
        comment: 'Current table status'
    },
    currentOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Active order at this table'
    },
    seatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When guests were seated'
    },
    guestCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of guests currently seated'
    },
    assignedWaiter: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID of assigned server'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional data (notes, preferences, etc.)'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether table is in use (not closed/removed)'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'tables',
    timestamps: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['floorPlanId'] },
        { fields: ['tenantId'] },
        { fields: ['currentOrderId'] }
    ]
});

module.exports = Table;
