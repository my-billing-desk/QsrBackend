const { sequelize } = require('./src/models');

async function addEnableTablesColumn() {
    try {
        await sequelize.getQueryInterface().addColumn('Outlets', 'enableTables', {
            type: sequelize.Sequelize.BOOLEAN,
            defaultValue: true
        });
        console.log('Added enableTables column to Outlets table');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('Column enableTables already exists');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        await sequelize.close();
    }
}

addEnableTablesColumn();
