const sequelize = require('../config/database');
const { Tenant } = require('../models');

async function syncDb() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync Tenant model to add new columns
        await Tenant.sync({ alter: true });

        console.log('Tenant model synced successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    } finally {
        await sequelize.close();
    }
}

syncDb();
