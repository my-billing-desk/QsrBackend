const { Tenant, Item, Category } = require('./src/models');
(async () => {
    try {
        const tenants = await Tenant.findAll();
        console.log(`Found ${tenants.length} tenants`);
        for (const t of tenants) {
            const items = await Item.count({ where: { tenantId: t.id } });
            const cats = await Category.count({ where: { tenantId: t.id } });
            console.log(`Tenant: ${t.name} (${t.id}) - Items: ${items}, Cats: ${cats}`);
            if (t.id === '3f353c0f-5326-401f-b673-59b875640aee') console.log('*** TARGET TENANT FOUND ***');
            if (items > 0) {
                const item = await Item.findOne({ where: { tenantId: t.id } });
                console.log('Sample Item:', JSON.stringify(item.toJSON(), null, 2));
            }
        }
    } catch (e) { console.error('Error:', e); }
})();
