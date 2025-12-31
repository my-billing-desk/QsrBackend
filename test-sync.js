const { Tenant, User, Role, Category, Item, Variant, AddonGroup, VariationGroup, Addon, Setting } = require('./src/models');

async function testSync(tenantId) {
    try {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) throw new Error('Tenant not found');

        const users = await User.findAll({
            where: { tenantId: tenant.id },
            attributes: ['id', 'username', 'displayName', 'password', 'passcode', 'tenantId', 'roleId'],
            include: [{ model: Role, as: 'roleData', attributes: ['name', 'permissions'] }]
        });

        const categories = await Category.findAll({ where: { tenantId: tenant.id } });
        const items = await Item.findAll({
            where: { tenantId: tenant.id },
            include: [
                { model: Variant },
                { model: AddonGroup, as: 'addonGroups', include: [Addon] },
                { model: VariationGroup, as: 'variationGroups', include: [Variant] }
            ]
        });

        const settings = await Setting.findAll({ where: { tenantId: tenant.id } });
        console.log('Sync Success!');
        console.log('Users count:', users.length);
        console.log('Categories count:', categories.length);
        console.log('Items count:', items.length);
    } catch (e) {
        console.error('Sync Failed:', e.message);
    } finally {
        process.exit();
    }
}

// Get first tenant
Tenant.findOne().then(t => {
    if (t) testSync(t.id);
    else { console.log('No tenants'); process.exit(); }
});
