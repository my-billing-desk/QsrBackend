const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FloorPlan = sequelize.define('FloorPlan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Floor plan name (Main Floor, Patio, etc.)'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    width: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        comment: 'Canvas width in pixels'
    },
    height: {
        type: DataTypes.INTEGER,
        defaultValue: 800,
        comment: 'Canvas height in pixels'
    },
    backgroundImage: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL to background image'
    },
    backgroundColor: {
        type: DataTypes.STRING,
        defaultValue: '#f5f5f5',
        comment: 'Background color'
    },
    gridSize: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
        comment: 'Grid snap size for positioning'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is the default floor plan'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional configuration (walls, zones, etc.)'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'floor_plans',
    timestamps: true,
    indexes: [
        { fields: ['tenantId'] },
        { fields: ['isActive'] }
    ]
});

module.exports = FloorPlan;
