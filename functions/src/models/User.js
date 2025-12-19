const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true, // Optional for Google Users
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'cashier'),
        defaultValue: 'cashier'
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    permissions: {
        type: DataTypes.JSON, // Stores permissions as a JSON object
        allowNull: true
    }
});

// Hash password before saving
User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

module.exports = User;
