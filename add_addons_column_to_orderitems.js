const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: console.log
});

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();
    try {
        console.log('Attempting to add addons column to OrderItems table...');
        await queryInterface.addColumn('OrderItems', 'addons', {
            type: Sequelize.JSON,
            allowNull: true
        });
        console.log('Successfully added addons column.');
    } catch (e) {
        console.error('Failed to add column (it might already exist):', e.message);
    }
}

migrate();
