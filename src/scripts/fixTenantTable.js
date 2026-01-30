const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixTenantTable() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Rename existing table safely
        await sequelize.query(`ALTER TABLE Tenants RENAME TO Tenants_old;`);

        // 2. Create new table with ALL columns
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Tenants (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(255) UNIQUE,
        status VARCHAR(255) DEFAULT 'active',
        subscriptionPlan VARCHAR(255) DEFAULT 'starter',
        otp VARCHAR(255),
        otpExpiresAt DATETIME,
        role VARCHAR(255) DEFAULT 'MASTER',
        parentTenantId UUID REFERENCES Tenants(id),
        fssaiNumber VARCHAR(255),
        royaltyPercentage FLOAT DEFAULT 10.0,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);

        // 3. Copy data manually (mapping existing columns)
        // Note: We only select columns that DEFINITELY exist in the old table.
        // If 'role' caused error before, it implies it might NOT exist in old table, 
        // OR Sequelize's 'sync alter' got confused.
        // Let's assume standard columns exist.

        // Check columns in old table first to be safe? 
        // SQLite doesn't easily let us select dynamic columns in pure SQL without PRAGMA check on the fly.
        // We will attempt a loose copy. 

        // Simplest: Check what columns exist via PRAGMA
        const columns = await sequelize.query(`PRAGMA table_info(Tenants_old)`, { type: QueryTypes.SELECT });
        const colNames = columns.map(c => c.name);

        console.log("Old columns:", colNames);

        const commonCols = colNames.filter(c =>
            ['id', 'name', 'subdomain', 'status', 'subscriptionPlan', 'otp', 'otpExpiresAt', 'createdAt', 'updatedAt']
                .includes(c)
        ).join(', ');

        await sequelize.query(`
        INSERT INTO Tenants (${commonCols})
        SELECT ${commonCols} FROM Tenants_old;
    `);

        // 4. Drop old table
        await sequelize.query(`DROP TABLE Tenants_old;`);

        console.log('Tenant table fixed successfully.');
    } catch (error) {
        console.error('Error fixing database:', error);
        // Attempt rollback
        try {
            await sequelize.query(`ALTER TABLE Tenants_old RENAME TO Tenants;`);
        } catch (e) { }
    } finally {
        await sequelize.close();
    }
}

fixTenantTable();
