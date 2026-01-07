const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    overallRating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    foodRating: {
        type: DataTypes.INTEGER,
        validate: { min: 1, max: 5 }
    },
    serviceRating: {
        type: DataTypes.INTEGER,
        validate: { min: 1, max: 5 }
    },
    ambianceRating: {
        type: DataTypes.INTEGER,
        validate: { min: 1, max: 5 }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    itemFeedback: {
        type: DataTypes.JSON, // Array of { itemId, rating, comment }
        allowNull: true
    },
    source: {
        type: DataTypes.ENUM('tablet', 'mobile', 'web'),
        defaultValue: 'web'
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'resolved'),
        defaultValue: 'pending'
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = Feedback;
