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
    role: {
        type: DataTypes.ENUM(
            'super_admin',       // System-wide access
            'admin',             // Brand/Tenant-wide access
            'zone_manager',      // Multiple cities/states
            'area_manager',      // Cluster of restaurants in an area
            'city_manager',      // All branches in a city
            'restaurant_manager',// Single outlet management
            'shift_manager',     // Management for a specific shift in an outlet
            'cashier',           // Billing only
            'waiter'             // KOT only
        ),
        defaultValue: 'cashier'
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
    permissions: {
        type: DataTypes.JSON, // Stores permissions as a JSON object
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
