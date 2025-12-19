const { Sequelize } = require('sequelize');
const path = require('path');

const fs = require('fs');
const os = require('os');

let storagePath = path.join(__dirname, '../../database.sqlite');

// Functions environment check
if (process.env.FUNCTIONS_WORKER_RUNTIME || process.env.FIREBASE_CONFIG || process.env.NODE_ENV === 'production') {
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

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
});

module.exports = sequelize;
