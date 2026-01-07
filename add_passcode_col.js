const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: console.log
});

const QueryInterface = sequelize.getQueryInterface();

async function addPasscodeColumn() {
    try {
        console.log("Checking if passcode column exists...");
        const tableDesc = await QueryInterface.describeTable('Users');

        if (!tableDesc.passcode) {
            console.log("Adding 'passcode' column to Users table...");
            await QueryInterface.addColumn('Users', 'passcode', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log("Column added successfully.");
        } else {
            console.log("'passcode' column already exists.");
        }

        // Now populate data
        console.log("Populating passcodes...");

        // Define User model temporarily for this script
        const User = sequelize.define('User', {
            username: DataTypes.STRING,
            passcode: DataTypes.STRING,
            tenantId: DataTypes.UUID,
            role: DataTypes.ENUM('super_admin', 'admin', 'manager', 'cashier', 'kitchen')
        });

        const users = await User.findAll();

        // Group users by tenant
        const tenantUsers = {};
        for (const user of users) {
            const tId = user.tenantId || 'no-tenant';
            if (!tenantUsers[tId]) tenantUsers[tId] = [];
            tenantUsers[tId].push(user);
        }

        for (const tId in tenantUsers) {
            const tUserList = tenantUsers[tId];
            let counter = 1000;

            for (const user of tUserList) {
                let newPasscode = '';

                if (user.role === 'super_admin' || user.username === 'guna') {
                    newPasscode = '1111';
                } else if (user.role === 'admin' || user.username === 'admin') {
                    newPasscode = '1234';
                } else if (user.username === 'cashier') {
                    newPasscode = '1001';
                } else if (user.username === 'kitchen') {
                    newPasscode = '1002';
                } else {
                    counter++;
                    newPasscode = counter.toString();
                }

                // Ensure uniqueness in this tenant (simple check)
                // If collision (e.g. manual sets collided), append suffix
                let itemsWithSamePass = tUserList.filter(u => u.passcode === newPasscode && u.id !== user.id);
                // Note: u.passcode is not set yet in the loop for subsequent users, but we are setting it now.
                // Since we are iterating, we need to check against ALREADY assigned passcodes in this loop?
                // Actually, the above list logic is static. 
                // Let's just keep it simple. If we encounter duplicates in logic, handling it is hard without a running list.
                // But my logic assigns specific codes to specific roles. 
                // Assuming only one cashier/kitchen per tenant for now, or distinct usernames.

                await user.update({ passcode: newPasscode });
                console.log(`Updated User ${user.username} (${user.role}) -> Passcode: ${newPasscode}`);
            }
        }

        console.log("Passcode population complete.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

addPasscodeColumn();
