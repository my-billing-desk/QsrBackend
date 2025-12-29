const { User, Tenant, Category, Item, Variant, AddonGroup, VariationGroup, Addon, Setting, POSDevice } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.login = async (req, res) => {
    try {
        console.log('[LOGIN_DEBUG] Body:', JSON.stringify(req.body));
        let { username, password, email, tenantId, subdomain, passcode } = req.body;

        // Auto-resolve tenantId if subdomain is used as tenantId (common in POS)
        let resolvedTenantId = tenantId;
        if (tenantId && !tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            const foundTenant = await Tenant.findOne({ where: { subdomain: tenantId } });
            if (foundTenant) {
                console.log(`[LOGIN_DEBUG] Resolved subdomain "${tenantId}" to UUID "${foundTenant.id}"`);
                resolvedTenantId = foundTenant.id;
            }
        }

        // Handle Passcode Login (mainly for POS)
        if (passcode) {
            console.log('[LOGIN_DEBUG] Attempting passcode login for resolved tenant:', resolvedTenantId);
            if (!resolvedTenantId) {
                return res.status(400).json({ error: 'Restaurant ID/Subdomain is required' });
            }

            const users = await User.findAll({
                where: { tenantId: resolvedTenantId },
                include: [{ model: Tenant }]
            });

            let validUser = null;
            for (const u of users) {
                if (u.passcode && await bcrypt.compare(passcode.toString(), u.passcode)) {
                    validUser = u;
                    break;
                }
            }

            if (!validUser) {
                return res.status(401).json({ error: 'Invalid passcode for this restaurant' });
            }

            return sendLoginResponse(validUser, res);
        }

        // Handle Standard Login
        const identifier = username || email;
        const missing = [];
        if (!identifier) missing.push('username/email');
        if (!password) missing.push('password');

        if (missing.length > 0) {
            return res.status(400).json({
                error: `[VER_2] ${missing.join(' and ')} required`,
                received: req.body
            });
        }

        const query = {
            [Op.or]: [
                { username: identifier },
                { email: identifier }
            ]
        };

        if (resolvedTenantId) query.tenantId = resolvedTenantId;

        let possibleUsers = await User.findAll({
            where: query,
            include: [{ model: Tenant }]
        });

        if (possibleUsers.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (subdomain) {
            possibleUsers = possibleUsers.filter(u => u.Tenant && u.Tenant.subdomain === subdomain);
        }

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
            return res.status(401).json({
                error: 'Ambiguous account. Please provide valid Store Code.',
                requireStoreCode: true
            });
        }

        return sendLoginResponse(validUsers[0], res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper to generate token and response
function sendLoginResponse(user, res) {
    console.log(`[AUTH DEBUG]PID:${process.pid} User: ${user.username}, ID: ${user.id}, TenantID: ${user.tenantId} (Type: ${typeof user.tenantId})`);
    if (user.Tenant && user.Tenant.status !== 'active') {
        return res.status(403).json({ error: 'Restaurant account is inactive' });
    }

    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.displayName, tenantId: user.tenantId },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return res.json({
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
}


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
            attributes: { exclude: ['password', 'passcode'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.syncUsers = async (req, res) => {
    try {
        if (!req.user.tenantId) {
            return res.status(400).json({ error: 'Tenant ID required for sync' });
        }
        const users = await User.findAll({
            where: { tenantId: req.user.tenantId },
            attributes: ['id', 'username', 'displayName', 'role', 'password', 'passcode', 'tenantId']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.initTerminal = async (req, res) => {
    try {
        const { idOrSubdomain } = req.params;
        console.log(`[INIT_DEBUG] Terminal init request for: "${idOrSubdomain}"`);

        // Find Tenant
        const tenant = await Tenant.findOne({
            where: {
                [Op.or]: [
                    { id: idOrSubdomain },
                    { subdomain: idOrSubdomain }
                ]
            }
        });

        if (!tenant) {
            console.log(`[INIT_DEBUG] Tenant not found for: "${idOrSubdomain}"`);
            return res.status(404).json({ error: 'Restaurant not found. Please verify the ID or Subdomain.' });
        }

        // Fetch Users (with hashes for offline login)
        const users = await User.findAll({
            where: { tenantId: tenant.id },
            attributes: ['id', 'username', 'displayName', 'role', 'password', 'passcode', 'tenantId']
        });

        // Fetch Menu
        const categories = await Category.findAll({ where: { tenantId: tenant.id } });
        const items = await Item.findAll({
            where: { tenantId: tenant.id },
            include: [
                { model: Variant },
                { model: AddonGroup, as: 'addonGroups', include: [Addon] }, // Include Addons in AddonGroup
                { model: VariationGroup, as: 'variationGroups', include: [Variant] } // Include Variants in VariationGroup
            ]
        });

        // Fetch Settings
        const settings = await Setting.findAll({ where: { tenantId: tenant.id } });
        // Convert settings array to object
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.key] = s.value);

        res.json({
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain
            },
            users,
            menu: {
                categories,
                items
            },
            settings: settingsObj
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Tenant }]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return sendLoginResponse(user, res);
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
