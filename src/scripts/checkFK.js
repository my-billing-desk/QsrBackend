const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        const result = await sequelize.query(`PRAGMA foreign_key_list(Users)`, { type: QueryTypes.SELECT });
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error(error);
    }
}

checkSchema();
