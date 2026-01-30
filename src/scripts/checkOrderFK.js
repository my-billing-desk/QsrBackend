const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function checkOrderFK() {
    try {
        const result = await sequelize.query(`PRAGMA foreign_key_list(Orders)`, { type: QueryTypes.SELECT });
        console.log("Orders FK:", JSON.stringify(result, null, 2));
    } catch (error) { console.error(error); }
}

checkOrderFK();
