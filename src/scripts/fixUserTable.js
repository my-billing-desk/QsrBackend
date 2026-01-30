const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixUserTable() {
    try {
        await sequelize.authenticate();

        await sequelize.query('PRAGMA foreign_keys = OFF;');

        // Check if Users_old exists (meaning previous run failed mid-way)
        const tables = await sequelize.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='Users_old'`, { type: QueryTypes.SELECT });

        if (tables.length > 0) {
            console.log("Users_old exists. Assuming previous run failed. using 'Users_old' as source.");
            // Drop incomplete 'Users' if exists
            await sequelize.query(`DROP TABLE IF EXISTS Users;`);
        } else {
            // Normal path
            await sequelize.query(`ALTER TABLE Users RENAME TO Users_old;`);
        }

        // Create new Users table with ALL columns
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id UUID PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) DEFAULT 'staff',
        googleId VARCHAR(255),  -- ADDED
        displayName VARCHAR(255),
        permissions TEXT,
        passcode VARCHAR(255),
        tenantId UUID REFERENCES Tenants(id) ON DELETE SET NULL, 
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);

        // Copy data
        const columns = [
            'id', 'username', 'email', 'password', 'role', 'googleId',
            'displayName', 'permissions', 'tenantId', 'passcode',
            'createdAt', 'updatedAt'
        ];
        const colsStr = columns.join(', ');

        await sequelize.query(`INSERT INTO Users (${colsStr}) SELECT ${colsStr} FROM Users_old;`);

        // Drop old
        await sequelize.query(`DROP TABLE Users_old;`);

        await sequelize.query('PRAGMA foreign_keys = ON;');

        console.log('User table fixed successfully.');

    } catch (error) {
        console.error('Error fixing User table:', error);
    }
}

fixUserTable();
