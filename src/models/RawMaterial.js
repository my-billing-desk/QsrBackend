const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RawMaterial = sequelize.define('RawMaterial', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Units & Conversion
    purchaseUnit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    consumptionUnit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    conversionFactor: {
        type: DataTypes.FLOAT,
        defaultValue: 1,
        comment: 'How many consumption units in 1 purchase unit'
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Prices
    purchasePrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    transferPrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    recommendedPrice: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    // Taxes
    taxType: {
        type: DataTypes.STRING, // 'GST' or 'VAT'
        defaultValue: 'GST'
    },
    taxPercent: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    // Stock Levels
    minStockLevel: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    minStockLevelUnit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    atParStockLevel: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    atParStockLevelUnit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    closingStockFrequency: {
        type: DataTypes.STRING,
        defaultValue: 'Daily'
    },

    // Restock
    allowRestockLevel: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    restockQty: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    restockUnit: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Codes
    barcode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hsnCode: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Other Details
    isExclusive: { // Exclusive in this restaurant
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    inExpiry: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    bestBeforeDays: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    allowDecimalQty: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    normalLossPercent: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    // Current Stock (Calculated or cached)
    currentStock: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    // Daily Opening Stock Snapshot
    openingStock: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    lastStockUpdateDate: {
        type: DataTypes.DATEONLY, // Format: YYYY-MM-DD
        allowNull: true
    },

    // Excise Report
    exciseQty: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    exciseOtin: {
        type: DataTypes.STRING,
        allowNull: true
    },
    exciseBrand: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = RawMaterial;
