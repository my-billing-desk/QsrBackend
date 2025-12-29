const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite'); // Adjust if DB name is different
const db = new sqlite3.Database(dbPath);

console.log('Adding paymentDetails column to Orders table...');

db.serialize(() => {
    db.run("ALTER TABLE Orders ADD COLUMN paymentDetails TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column paymentDetails already exists.');
            } else {
                console.error('Error adding column:', err.message);
            }
        } else {
            console.log('Successfully added paymentDetails column.');
        }
    });
});

db.close();
