const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Primary Identification
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [10, 15]
        },
        comment: 'Customer mobile number (primary identifier)'
    },

    // Personal Information
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Customer full name'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
    },

    // Address Information
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pincode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    landmark: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Loyalty & Engagement
    loyaltyPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Accumulated loyalty points'
    },
    totalSpent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Lifetime spending'
    },
    totalOrders: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total number of orders'
    },
    averageOrderValue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Average order value'
    },
    lastOrderDate: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Preferences
    dietaryPreferences: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Veg, Non-veg, Vegan, allergies, etc.'
    },
    favoriteItems: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of frequently ordered item IDs'
    },
    preferredPaymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Customer Tier/Segment
    customerTier: {
        type: DataTypes.ENUM('regular', 'silver', 'gold', 'platinum', 'vip'),
        defaultValue: 'regular',
        comment: 'Customer loyalty tier'
    },

    // Tags & Notes
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Custom tags (e.g., ["regular", "high-value", "breakfast-lover"])'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Staff notes about customer'
    },

    // Status
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Marketing
    allowMarketingSMS: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    allowMarketingEmail: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    allowMarketingWhatsApp: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

    // Multi-tenant
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'customers',
    timestamps: true,
    indexes: [
        { fields: ['phone', 'tenantId'], unique: true },
        { fields: ['email'] },
        { fields: ['tenantId'] },
        { fields: ['customerTier'] },
        { fields: ['loyaltyPoints'] },
        { fields: ['totalSpent'] }
    ]
});

module.exports = Customer;
