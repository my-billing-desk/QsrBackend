const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeIngredient = sequelize.define('RecipeIngredient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    recipeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rawMaterialId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    unit: {
        type: DataTypes.STRING, // Should match RawMaterial's consumption unit usually
        allowNull: false
    },
    wastagePercent: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
,
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = RecipeIngredient;
