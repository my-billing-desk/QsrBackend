const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Variant = sequelize.define('Variant', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: true // Can be global or specific to an item
    },
    variationGroupId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sapCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    packingCharges: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isDelivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isTakeaway: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isDineIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
,
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = Variant;
