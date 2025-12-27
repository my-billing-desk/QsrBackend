const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AddonGroup = sequelize.define('AddonGroup', {
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
    minSelection: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    maxSelection: {
        type: DataTypes.INTEGER,
        defaultValue: 1 // 1 for radio, >1 for checkbox
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = AddonGroup;
