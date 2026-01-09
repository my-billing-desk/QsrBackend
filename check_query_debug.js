require('dotenv').config();
const { Item, Category, Variant, Addon, AddonGroup, VariationGroup, sequelize } = require('./src/models');

async function check() {
    try {
        const tenantId = '24016a5e-1b4b-4ae7-a04b-f5b342dfaba9'; // Taken from previous debug output
        console.log('Testing full Item query with tenantId:', tenantId);

        const items = await Item.findAll({
            where: { tenantId: tenantId },
            include: [
                Category,
                {
                    model: VariationGroup,
                    as: 'variationGroups',
                    include: [Variant]
                },
                {
                    model: Variant,
                    include: [VariationGroup]
                },
                {
                    model: AddonGroup,
                    as: 'addonGroups',
                    include: [Addon]
                }
            ]
        });

        console.log(`Query successful. Found ${items.length} items.`);
        if (items.length > 0) {
            console.log('Sample item:', JSON.stringify(items[0].toJSON(), null, 2));
        }

    } catch (e) {
        console.error('Query failed:', e);
    }
    process.exit(0);
}

check();
