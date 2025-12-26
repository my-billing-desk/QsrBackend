const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    station: {
        type: DataTypes.STRING,
        defaultValue: 'Kitchen',
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    onlineDisplay: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = Category;
