const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VariationGroup = sequelize.define('VariationGroup', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    onlineDisplayName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    departmentName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = VariationGroup;
