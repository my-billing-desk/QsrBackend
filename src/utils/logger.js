const fs = require('fs');
const path = require('path');

exports.logToFile = (msg) => {
    try {
        const logPath = path.join(__dirname, '../../debug.log');
        fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
};
