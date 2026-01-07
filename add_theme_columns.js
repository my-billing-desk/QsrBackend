const { sequelize } = require('./src/models');

async function addColumns() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = sequelize.getQueryInterface();

        try {
            await queryInterface.addColumn('Outlets', 'themeName', {
                type: sequelize.Sequelize.STRING,
                defaultValue: 'Emerald & Slate (Light)'
            });
            console.log('Added themeName');
        } catch (e) { console.log('themeName might already exist', e.message); }

        try {
            await queryInterface.addColumn('Outlets', 'themeColor', {
                type: sequelize.Sequelize.STRING,
                defaultValue: '#10B981'
            });
            console.log('Added themeColor');
        } catch (e) { console.log('themeColor might already exist', e.message); }

        try {
            await queryInterface.addColumn('Outlets', 'themePalette', {
                type: sequelize.Sequelize.TEXT
            });
            console.log('Added themePalette');
        } catch (e) { console.log('themePalette might already exist', e.message); }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

addColumns();
