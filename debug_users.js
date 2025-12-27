const { User, sequelize } = require('./src/models');
async function listUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        console.log('--- USERS ---');
        users.forEach(u => console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, TenantId: ${u.tenantId}`));
        console.log('--- END USERS ---');
    } catch(e) { console.error(e); }
    finally { process.exit(); }
}
listUsers();
