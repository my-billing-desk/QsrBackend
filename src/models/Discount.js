const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Discount = sequelize.define('Discount', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('percentage', 'flat'),
        defaultValue: 'percentage'
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Discount;
