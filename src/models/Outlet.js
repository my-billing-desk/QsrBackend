const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Outlet = sequelize.define('Outlet', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Outlet Information
    name: { type: DataTypes.STRING, allowNull: false },
    alias: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },

    // Address Information
    landmark: { type: DataTypes.STRING },
    zipCode: { type: DataTypes.STRING },
    pinCode: { type: DataTypes.STRING }, // 'Pin' in screenshot
    tinNo: { type: DataTypes.STRING },
    country: { type: DataTypes.STRING, defaultValue: 'India' },
    state: { type: DataTypes.STRING, defaultValue: 'Karnataka' },
    city: { type: DataTypes.STRING, defaultValue: 'Bengaluru' },
    zone: { type: DataTypes.STRING, comment: 'e.g. North, South, East, West or specific business zone' },
    timezone: { type: DataTypes.STRING, defaultValue: 'Asia/Calcutta' },
    address: { type: DataTypes.TEXT },
    area: { type: DataTypes.STRING },
    latitude: { type: DataTypes.STRING },
    longitude: { type: DataTypes.STRING },

    // Additional Information
    additionalInfo: { type: DataTypes.TEXT },
    cuisines: { type: DataTypes.STRING }, // Comma separated or JSON
    seatingCapacity: { type: DataTypes.STRING },
    restaurantType: { type: DataTypes.STRING }, // QSR, Dine In, etc.
    onlineOrderChannels: { type: DataTypes.STRING }, // Zomato, Swiggy, etc.
    fssaiLicNo: { type: DataTypes.STRING },
    taxAuthorityName: { type: DataTypes.STRING, defaultValue: 'GST' },
    outletServingType: { type: DataTypes.STRING }, // Service, Goods, Both
    enableKOTForOnlineOrder: { type: DataTypes.BOOLEAN, defaultValue: true },

    // Theme Configuration
    themeColor: {
        type: DataTypes.STRING,
        defaultValue: '#dc2626', // Default red theme
        comment: 'Primary theme color in hex format (e.g., #dc2626)'
    },
    themeName: {
        type: DataTypes.STRING,
        defaultValue: 'Ruby Red',
        comment: 'Human readable name for the selected theme'
    },

    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = Outlet;
