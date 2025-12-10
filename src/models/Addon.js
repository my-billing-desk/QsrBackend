const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Addon = sequelize.define('Addon', {
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
    type: {
        type: DataTypes.ENUM('veg', 'non-veg', 'egg'),
        defaultValue: 'veg'
    },
    addonGroupId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = Addon;
