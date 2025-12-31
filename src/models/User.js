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
        unique: 'user_tenant_unique' // Scoped to tenant
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

    // Hierarchical Scope
    assignedOutletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Direct link to a single outlet'
    },
    assignedOutlets: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of Outlet IDs for Area/City managers'
    },
    assignedRegion: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Geographical scope { zone, city, state }'
    },
    assignedShift: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Shift name/code for Shift Managers'
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
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passcode: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'user_tenant_unique'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: 'user_tenant_unique'
    },
    roleId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

// Hash password and passcode before saving
User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    if (user.passcode) {
        user.passcode = await bcrypt.hash(user.passcode, 10);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    if (user.changed('passcode')) {
        user.passcode = await bcrypt.hash(user.passcode, 10);
    }
});

module.exports = User;
