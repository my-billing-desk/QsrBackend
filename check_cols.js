const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

async function checkColumn() {
    const qi = sequelize.getQueryInterface();
    const tableInfo = await qi.describeTable('OrderItems');
    console.log('OrderItems columns:', Object.keys(tableInfo));
}

checkColumn();
