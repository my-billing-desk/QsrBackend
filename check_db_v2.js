require('dotenv').config();
const { User, Tenant, sequelize } = require('./src/models');
const path = require('path');

async function check() {
    try {
        console.log('Storage:', sequelize.options.storage);

        // Check Tenants
        const tenants = await Tenant.findAll();
        console.log('--- Tenants ---');
        tenants.forEach(t => console.log(`Tenant: ${t.name} | ID: ${t.id}`));

        // Test findAll
        const users = await User.findAll({
            include: [{ model: Tenant }]
        });

        console.log('--- findAll ---');
        users.forEach(u => {
            console.log(`User: ${u.username} | ID: ${u.id} | TenantID: ${u.tenantId}`);
        });

        // Test findByPk (like Controller)
        console.log('--- findByPk ---');
        const admin = await User.findByPk(2, {
            include: [{ model: Tenant }]
        });
        if (admin) {
            console.log(`User: ${admin.username} | ID: ${admin.id} | TenantID: ${admin.tenantId} | TenantName: ${admin.Tenant?.name}`);
            console.log('Raw:', admin.get({ plain: true }));
        } else {
            console.log('Admin not found by PK 2');
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
