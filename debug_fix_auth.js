const { sequelize, User, Tenant, PosDevice } = require('./src/models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

async function run() {
    try {
        // 1. Get Tenant
        const tenant = await Tenant.findOne({ where: { subdomain: 'sunburst' } });
        if (!tenant) {
            console.error('Tenant sunburst not found');
            process.exit(1);
        }
        console.log('Tenant ID:', tenant.id);

        // 2. Get User
        const user = await User.findOne({ where: { username: 'guna', tenantId: tenant.id } });
        if (!user) {
            console.error('User guna not found');
            process.exit(1);
        }

        // 3. Generate Token
        // Using the same payload structure as the one in the curl command
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.displayName, tenantId: tenant.id, permissions: [] },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('NEW_TOKEN:', token);

        // 4. Check/Create Device
        const deviceId = '3f353c0f-5326-401f-b673-59b875640aee';
        let device = await PosDevice.findByPk(deviceId);

        if (!device) {
            console.log('Device not found, creating it...');
            device = await PosDevice.create({
                id: deviceId,
                name: 'Test Terminal',
                code: 'TERM-01',
                status: 'active',
                tenantId: tenant.id
            });
            console.log('Device created');
        } else {
            console.log('Device exists');
            if (device.tenantId !== tenant.id) {
                console.warn('WARNING: Device belongs to different tenant:', device.tenantId);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

run();
