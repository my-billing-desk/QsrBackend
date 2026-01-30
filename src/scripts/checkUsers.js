const { User, Tenant } = require('../models');

async function debugUsers() {
    try {
        const users = await User.findAll({
            include: [{ model: Tenant }],
            attributes: ['id', 'username', 'email', 'role', 'tenantId']
        });

        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debugUsers();
