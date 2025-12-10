const { sequelize, User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await sequelize.sync();

        const adminExists = await User.findOne({ where: { username: 'guna' } });
        if (!adminExists) {
            console.log('Seeding default admin user...');
            await User.create({
                username: 'guna',
                password: 'king123',
                role: 'super_admin',
                displayName: 'Super Admin',
                email: 'guna.swtkiller@gmail.com'
            });
            console.log('Admin user created (admin / password123)');
        } else {
            console.log('Admin user already exists.');
        }

    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        // We don't close connection as this script might be required by server start
        // process.exit();
    }
}

seed();
