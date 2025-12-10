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
        await queryInterface.addColumn('VariationGroups', 'onlineDisplayName', {
            type: Sequelize.STRING,
            allowNull: true
        });
        console.log('Added onlineDisplayName');
    } catch (e) { console.log('onlineDisplayName might already exist'); }

    try {
        await queryInterface.addColumn('VariationGroups', 'departmentName', {
            type: Sequelize.STRING,
            allowNull: true
        });
        console.log('Added departmentName');
    } catch (e) { console.log('departmentName might already exist'); }

    try {
        await queryInterface.addColumn('VariationGroups', 'isActive', {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        });
        console.log('Added isActive');
    } catch (e) { console.log('isActive might already exist'); }
}

migrate();
