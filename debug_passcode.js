const { User, Tenant } = require('./src/models');
const bcrypt = require('bcryptjs');

async function debugPasswords() {
    try {
        const tenant = await Tenant.findOne({ where: { subdomain: 'sunburst' } });
        console.log('Tenant:', tenant.id);

        const users = await User.findAll({ where: { tenantId: tenant.id } });
        console.log('Users found:', users.length);

        const passcode = '123';
        console.log('Testing Passcode:', passcode);

        for (const u of users) {
            const match = await bcrypt.compare(passcode, u.password);
            console.log(`User: ${u.username} (${u.role}) - Match: ${match}`);
        }

    } catch (e) {
        console.error(e);
    }
}

debugPasswords();
