const { sequelize } = require('./src/models');

async function addOtpCols() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        await queryInterface.addColumn('Tenants', 'otp', {
            type: 'VARCHAR(255)',
            allowNull: true
        });
        await queryInterface.addColumn('Tenants', 'otpExpiresAt', {
            type: 'DATETIME',
            allowNull: true
        });
        console.log('Columns added successfully');
    } catch (e) {
        console.log('Error (maybe columns exist):', e.message);
    }
}

addOtpCols();
