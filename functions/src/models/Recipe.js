const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Keep it flexible, it can be linked to Item OR Variant
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    variantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    name: { // Optional, usually same as Item name
        type: DataTypes.STRING,
        allowNull: true
    },
    yieldQty: {
        type: DataTypes.FLOAT,
        defaultValue: 1
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Recipe;
