const { User } = require('../models');

async function assignTenant() {
    try {
        const tenantId = '3034a6ec-d25d-4e13-9d1e-6de251113523';

        await User.update({ tenantId: tenantId }, { where: {} }); // Update ALL users

        console.log('All users assigned to tenant:', tenantId);
    } catch (e) {
        console.error(e);
    }
}

assignTenant();
