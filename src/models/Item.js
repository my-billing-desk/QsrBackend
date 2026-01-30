const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shortCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    areaPrices: {
        type: DataTypes.JSON,
        allowNull: true
    },
    lastPublishedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    scheduledPublishTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // addonGroupId removed as we use Many-to-Many relationship
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isVeg: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    availableOffline: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    availableSwiggy: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    availableZomato: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // New fields for full CSV support
    onlineName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    shortCode2: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sapCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hsnCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    attributes: {
        type: DataTypes.STRING, // Comma separated tags or JSON? Using String for simplicity "Spicy, Vegan"
        allowNull: true
    },
    goodsServices: {
        type: DataTypes.STRING, // "Goods" or "Services"
        defaultValue: 'Goods'
    },
    unit: {
        type: DataTypes.STRING, // "Pcs", "Kg", "Portion"
        defaultValue: 'Pcs'
    },
    isSelfItemRecipe: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    minimumStockLevel: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    atParStockLevel: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    rank: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    packingCharges: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    allowDecimalQty: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    orderDelivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    orderTakeAway: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    orderDineIn: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    showImage: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    availableOndc: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    ondcTags: {
        type: DataTypes.JSON,
        allowNull: true
    },
    // Multi-Tenancy Global Menu Fields
    isGlobal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'If true, this comes from the Master Tenant and cannot be edited by Sub-tenants'
    },
    masterItemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Reference to the original Item ID in the Master Tenant scope if this is a sync copy'
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = Item;
