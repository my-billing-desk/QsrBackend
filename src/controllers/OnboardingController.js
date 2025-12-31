const { Tenant, User, sequelize } = require('../models');
const jwt = require('jsonwebtoken');

const generateToken = (user, tenant) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, tenantId: tenant.id },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '30d' }
    );
};

exports.signup = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { businessName, subdomain, email, password, phone, name } = req.body;

        // 1. Validation
        if (!businessName || !subdomain || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingTenant = await Tenant.findOne({ where: { subdomain } });
        if (existingTenant) {
            return res.status(400).json({ error: 'Subdomain already taken' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Create Tenant
        const tenant = await Tenant.create({
            name: businessName,
            subdomain: subdomain.toLowerCase(),
            status: 'trial',
            subscriptionPlan: 'starter',
            subscriptionExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }, { transaction: t });

        // 3. Create Default Role for Super Admin
        const { Role } = require('../models');
        const role = await Role.create({
            name: 'super_admin',
            tenantId: tenant.id,
            description: 'Full System Access',
            permissions: [] // You can pre-fill this if you have a default set
        }, { transaction: t });

        // 4. Create Super Admin User
        const user = await User.create({
            username: email.split('@')[0], // Generate simple username
            email,
            password,
            displayName: name || businessName,
            phone: phone || null,
            roleId: role.id,
            tenantId: tenant.id
        }, { transaction: t });

        await t.commit();

        // Load the role data for the response
        const userWithRole = await User.findByPk(user.id, {
            include: [{ model: Role, as: 'roleData' }, { model: Tenant }]
        });

        // 5. Generate Token
        const token = generateToken(userWithRole, tenant);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain
            },
            user: {
                id: userWithRole.id,
                email: userWithRole.email,
                username: userWithRole.username,
                name: userWithRole.displayName,
                role: 'super_admin',
                tenantId: userWithRole.tenantId
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Signup failed', details: error.message });
    }
};
