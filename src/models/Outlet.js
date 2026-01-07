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
    themeName: { type: DataTypes.STRING, defaultValue: 'Emerald & Slate (Light)' },
    themeColor: { type: DataTypes.STRING, defaultValue: '#10B981' },
    themePalette: { type: DataTypes.TEXT }, // Stores the full JSON palette

    tenantId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = Outlet;
