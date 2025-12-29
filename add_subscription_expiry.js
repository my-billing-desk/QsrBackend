const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: console.log
});

const addColumn = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        await queryInterface.addColumn('Tenants', 'subscriptionExpiryDate', {
            type: DataTypes.DATE,
            allowNull: true
        });
        console.log('Column subscriptionExpiryDate added successfully.');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('Column subscriptionExpiryDate already exists.');
        } else {
            console.error('Error adding column:', error);
        }
    }
};

addColumn();
