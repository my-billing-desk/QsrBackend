const { User, Tenant } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.login = async (req, res) => {
    try {
        let { username, password, email, tenantId, subdomain } = req.body;
        const identifier = username || email;

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Username/Email and Password are required' });
        }

        // Build query
        const query = {
            [Op.or]: [
                { username: identifier },
                { email: identifier }
            ]
        };

        // If specific tenant requested (e.g. from POS config)
        if (tenantId) {
            query.tenantId = tenantId;
        }

        let possibleUsers = await User.findAll({
            where: query,
            include: [{ model: Tenant }]
        });

        if (possibleUsers.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // If subdomain is provided, filter by it
        // (Assuming the frontend sends subdomain if running on one, or user entered store code)
        if (subdomain) {
            possibleUsers = possibleUsers.filter(u => u.Tenant && u.Tenant.subdomain === subdomain);
        }

        // If multiple users found, try to verify password for all to see if only one matches
        // (This handles case where same username has different passwords across tenants)
        let validUsers = [];
        for (const u of possibleUsers) {
            if (await bcrypt.compare(password, u.password)) {
                validUsers.push(u);
            }
        }

        if (validUsers.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (validUsers.length > 1) {
            // Ambiguous! We strictly require a tenant identifier now.
            // Do NOT reveal the accounts.
            return res.status(401).json({
                error: 'Ambiguous account. Please provide valid Store Code.',
                requireStoreCode: true
            });
        }

        const user = validUsers[0];

        // CHECK TENANT STATUS
        if (user.Tenant && user.Tenant.status !== 'active') {
            return res.status(403).json({ error: 'Restaurant account is inactive' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.displayName, tenantId: user.tenantId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.displayName,
                tenantId: user.tenantId,
                tenantName: user.Tenant?.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password, role, displayName, permissions } = req.body;
        const tenantId = req.user.tenantId; // Get from authenticated user

        const user = await User.create({
            username,
            password,
            role,
            displayName,
            permissions,
            tenantId
        });

        // Return without password
        const { password: _, ...userData } = user.toJSON();
        res.status(201).json(userData);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { tenantId: req.user.tenantId },
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const passport = require('passport');

exports.googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.redirect('http://localhost:5174/login?error=auth_failed');
        }

        // Only Super Admin can login via Google
        if (user.role !== 'super_admin') {
            return res.redirect('http://localhost:5174/login?error=unauthorized_role');
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.displayName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Redirect to Web Admin with token
        res.redirect(`http://localhost:5174/login?token=${token}&username=${user.displayName}&role=${user.role}&id=${user.id}`);
    })(req, res, next);
};
