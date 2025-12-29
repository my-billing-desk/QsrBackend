const { User, Tenant } = require('./src/models');

async function check() {
    try {
        const users = await User.findAll({
            include: [{ model: Tenant }]
        });

        console.log('--- DB CHECK ---');
        users.forEach(u => {
            console.log(`User: ${u.username} | ID: ${u.id} | TenantID: ${u.tenantId} | TenantName: ${u.Tenant?.name}`);
        });
        console.log('----------------');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

check();
