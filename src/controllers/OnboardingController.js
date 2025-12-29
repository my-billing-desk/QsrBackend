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
            status: 'active',
            subscriptionPlan: 'starter'
        }, { transaction: t });

        // 3. Create Super Admin User
        const user = await User.create({
            username: email.split('@')[0], // Generate simple username
            email,
            password,
            displayName: name || businessName,
            phone: phone || null,
            role: 'super_admin',
            tenantId: tenant.id
        }, { transaction: t });

        await t.commit();

        // 4. Generate Token
        const token = generateToken(user, tenant);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain
            },
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.displayName,
                role: user.role,
                tenantId: user.tenantId
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Signup failed', details: error.message });
    }
};
