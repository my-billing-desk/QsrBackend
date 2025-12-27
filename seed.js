const {
    sequelize, User, Category, Item, Variant,
    RawMaterial, Supplier, Purchase, PurchaseItem,
    Recipe, RecipeIngredient, Order, OrderItem, Tax, Outlet, Tenant
} = require('./src/models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await sequelize.sync({ force: true }); // Wipe and recreate for clean seed

        console.log('--- Starting Seed ---');

        // 1. Tenant
        console.log('Seeding Tenant...');
        const [tenant] = await Tenant.findOrCreate({
            where: { subdomain: 'default' },
            defaults: { name: 'Default Restaurant', status: 'active', subscriptionPlan: 'enterprise' }
        });
        const tenantId = tenant.id;

        // 2. Users
        const adminExists = await User.findOne({ where: { username: 'guna' } });
        if (!adminExists) {
            console.log('Seeding default admin user...');
            await User.create({
                username: 'guna',
                password: 'king123',
                role: 'super_admin',
                displayName: 'Super Admin',
                email: 'guna.swtkiller@gmail.com',
                tenantId: tenantId
            });
        } else {
            console.log('Admin user exists.');
        }

        console.log('--- Seed Completed Successfully ---');
        process.exit(0);

    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
