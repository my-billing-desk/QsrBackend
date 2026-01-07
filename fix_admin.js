const { User, Tenant } = require('./src/models');

async function fixAdmin() {
    try {
        const tenant = await Tenant.findOne({ where: { subdomain: 'sunburst' } });
        if (!tenant) {
            console.log('Tenant not found');
            return;
        }

        const admin = await User.findOne({ where: { username: 'admin' } });
        if (admin) {
            console.log('Updating admin tenantId to:', tenant.id);
            admin.tenantId = tenant.id;
            await admin.save();
            console.log('Admin updated');
        }

        const guna = await User.findOne({ where: { username: 'guna' } });
        if (guna) {
            console.log('Updating guna tenantId to:', tenant.id);
            guna.tenantId = tenant.id;
            await guna.save();
            console.log('Guna updated');
        }
    } catch (error) {
        console.error(error);
    }
}

fixAdmin();
