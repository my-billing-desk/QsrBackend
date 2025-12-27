const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemVariationGroup = sequelize.define('ItemVariationGroup', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    variationGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
,
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = ItemVariationGroup;
