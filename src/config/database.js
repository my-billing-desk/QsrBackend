const { Sequelize } = require('sequelize');
const path = require('path');

const fs = require('fs');
const os = require('os');

let storagePath = path.join(__dirname, '../../database.sqlite');

// Functions environment check, but prefer explicit DATABASE_PATH if set (e.g. for Render Disk)
if (process.env.DATABASE_PATH) {
    storagePath = process.env.DATABASE_PATH;
} else if (process.env.FUNCTIONS_WORKER_RUNTIME || process.env.FIREBASE_CONFIG || process.env.NODE_ENV === 'production') {
    const tmpPath = path.join(os.tmpdir(), 'database.sqlite');
    // Copy if not exists
    if (!fs.existsSync(tmpPath)) {
        try {
            if (fs.existsSync(storagePath)) {
                fs.copyFileSync(storagePath, tmpPath);
                console.log('Database copied to /tmp');
            } else {
                console.warn('Source database not found, creating new at /tmp');
            }
        } catch (e) {
            console.error('Failed to copy database to /tmp', e);
        }
    }
    storagePath = tmpPath;
}

// Check for PostgreSQL config (Cloud SQL / Docker)
const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

console.log('[DB Config] Storage Path:', storagePath);
console.log('[DB Config] Dialect:', dialect);

if (dialect === 'postgres') {
    sequelize = new Sequelize(
        process.env.DB_NAME || 'qsr_db',
        process.env.DB_USER || 'qsr_user',
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST || '127.0.0.1',
            dialect: 'postgres',
            port: process.env.DB_PORT || 5432,
            logging: false,
            dialectOptions: {
                // Cloud SQL often benefits from SSL/socket options, but clear defaults work for Docker
                ssl: process.env.DB_SSL === 'true' ? {
                    require: true,
                    rejectUnauthorized: false
                } : undefined
            }
        }
    );
} else {
    // SQLite Fallback (Original Logic)
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: storagePath, // Determined above
        logging: false
    });
}

module.exports = sequelize;
