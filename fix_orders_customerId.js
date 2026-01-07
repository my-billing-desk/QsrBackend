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
        await queryInterface.addColumn('Orders', 'customerId', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
        console.log('Added customerId to Orders');
    } catch (e) {
        console.log('customerId might already exist or error occurred:', e.message);
    }
    process.exit(0);
}

migrate();
