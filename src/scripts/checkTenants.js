const { Tenant } = require('../models');

async function debugTenants() {
    try {
        const tenants = await Tenant.findAll();
        console.log(JSON.stringify(tenants, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debugTenants();
