const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS Categories_backup", (err) => {
        if (err) {
            console.error("Error dropping Categories_backup:", err.message);
        } else {
            console.log("Dropped Categories_backup if existed.");
        }
    });

    // Also drop Orders_backup just in case
    db.run("DROP TABLE IF EXISTS Orders_backup", (err) => {
        if (err) console.log(err);
        else console.log("Dropped Orders_backup");
    });
});

db.close();
