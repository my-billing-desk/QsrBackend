const { Tenant } = require('./src/models');

async function checkTenant() {
    try {
        const tenants = await Tenant.findAll();
        console.log('Tenants:', JSON.stringify(tenants, null, 2));
    } catch (error) {
        console.error(error);
    }
}

checkTenant();
