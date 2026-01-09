require('dotenv').config();
const { Item, Category, sequelize } = require('./src/models');

async function check() {
    try {
        console.log('Checking database...');
        const items = await Item.findAll();
        console.log(`Found ${items.length} items.`);
        items.forEach(i => console.log(`Item: ${i.name}, TenantID: ${i.tenantId}, CategoryID: ${i.categoryId}`));

        const categories = await Category.findAll();
        console.log(`Found ${categories.length} categories.`);
        categories.forEach(c => console.log(`Category: ${c.name}, TenantID: ${c.tenantId}`));

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
