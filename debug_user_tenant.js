const { User, Tenant } = require('./src/models');

async function checkUser() {
    try {
        const user = await User.findOne({
            where: { username: 'guna' },
            include: [Tenant]
        });
        console.log('User:', JSON.stringify(user, null, 2));
    } catch (error) {
        console.error(error);
    }
}

checkUser();
