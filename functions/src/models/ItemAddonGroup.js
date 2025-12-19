const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemAddonGroup = sequelize.define('ItemAddonGroup', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    addonGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = ItemAddonGroup;
