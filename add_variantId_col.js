const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: console.log
});

const QueryInterface = sequelize.getQueryInterface();

async function addCol() {
    try {
        const tableDesc = await QueryInterface.describeTable('OrderItems');
        if (!tableDesc.variantId) {
            console.log('Adding variantId column...');
            await QueryInterface.addColumn('OrderItems', 'variantId', {
                type: DataTypes.INTEGER,
                allowNull: true
            });
            console.log('Column added.');
        } else {
            console.log('Column already exists.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

addCol();
