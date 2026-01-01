const { User, Tenant, Category, Item, Variant, AddonGroup, VariationGroup, Addon, Setting, POSDevice, Role } = require('../models');
const emailService = require('../utils/emailService');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// In-memory OTP store (Use Redis or DB for production)
const otpStore = new Map();

const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2
        ? name.substring(0, 2) + '*'.repeat(name.length - 2)
        : name[0] + '*';
    return `${maskedName}@${domain}`;
};

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
                include: [
                    { model: Tenant },
                    { model: Role, as: 'roleData' }
                ]
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

            return await sendLoginResponse(validUser, res);
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
            include: [
                { model: Tenant },
                { model: Role, as: 'roleData' }
            ]
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

        return await sendLoginResponse(validUsers[0], res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper to generate token and response
async function sendLoginResponse(user, res) {
    console.log(`[AUTH DEBUG]PID:${process.pid} User: ${user.username}, ID: ${user.id}, TenantID: ${user.tenantId} (Type: ${typeof user.tenantId})`);

    let daysLeft = null;
    const tenant = user.Tenant;

    if (tenant) {
        if (tenant.status === 'inactive' || tenant.status === 'suspended') {
            return res.status(403).json({ error: 'Restaurant account is inactive' });
        }

        if (tenant.status === 'onboard_pending') {
            return res.status(403).json({ error: 'Trial expired. Please upgrade your plan.' });
        }

        const now = new Date();
        const expiryDate = tenant.subscriptionExpiryDate ? new Date(tenant.subscriptionExpiryDate) : null;

        // Fallback for trials created before logic update (uses createdAt)
        if (tenant.status === 'trial' && !expiryDate) {
            const createdAt = new Date(tenant.createdAt);
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysPassed = (now - createdAt) / msPerDay;

            if (daysPassed > 7) {
                tenant.status = 'onboard_pending';
                await tenant.save();
                return res.status(403).json({ error: 'Trial expired. Please upgrade your plan.' });
            }
            daysLeft = Math.ceil(7 - daysPassed);
        }
        else if (expiryDate) {
            const msPerDay = 1000 * 60 * 60 * 24;
            const timeLeft = expiryDate - now;

            if (timeLeft < 0) {
                if (tenant.status === 'trial') {
                    tenant.status = 'onboard_pending';
                    await tenant.save();
                    return res.status(403).json({ error: 'Trial expired. Please upgrade your plan.' });
                } else if (tenant.status === 'active') {
                    // For active, we might not block immediately but warn, or block. 
                    // User request didn't specify blocking for active, just showing days.
                    daysLeft = 0;
                }
            } else {
                daysLeft = Math.ceil(timeLeft / msPerDay);
            }
        }
    }

    const permissions = user.roleData ? user.roleData.permissions : [];
    const roleName = user.roleData ? user.roleData.name : 'guest';

    const token = jwt.sign(
        { id: user.id, role: roleName, name: user.displayName, tenantId: user.tenantId, permissions },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: roleName,
            name: user.displayName,
            tenantId: user.tenantId,
            tenantName: user.Tenant?.name,
            tenantStatus: user.Tenant?.status, // Send status to frontend to distinguish trial vs active
            roleId: user.roleId,
            permissions
        },
        daysLeft // Renamed from trialDaysLeft to generic daysLeft, but we can fallback map it in frontend
    });
}


exports.register = async (req, res) => {
    try {
        const { username, password, displayName, roleId, email } = req.body;
        const tenantId = req.user.tenantId; // Get from authenticated user

        const user = await User.create({
            username,
            password,
            displayName,
            email,
            roleId,
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
            attributes: { exclude: ['password', 'passcode'] },
            include: [{ model: Role, as: 'roleData', attributes: ['name', 'permissions'] }]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, displayName, passcode, roleId, email } = req.body;

        const user = await User.findOne({
            where: { id, tenantId: req.user.tenantId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Owner protection: If trying to change roleId away from super_admin
        if (roleId !== undefined && roleId !== user.roleId) {
            const superAdminRole = await Role.findOne({ where: { name: 'super_admin', tenantId: req.user.tenantId } });
            if (superAdminRole && user.roleId === superAdminRole.id) {
                const superAdminCount = await User.count({ where: { roleId: superAdminRole.id, tenantId: req.user.tenantId } });
                if (superAdminCount <= 1) {
                    return res.status(400).json({ error: 'At least one owner (super_admin) is required. Cannot demote the last owner.' });
                }
            }
        }

        // Update fields
        if (username) user.username = username;
        if (email) user.email = email; // Allow email updates
        if (password) user.password = password; // Hook in model handles hashing
        if (displayName) user.displayName = displayName;
        if (passcode) user.passcode = passcode; // Hook in model handles hashing
        if (roleId !== undefined) user.roleId = roleId;

        await user.save();

        const { password: _, passcode: __, ...userData } = user.toJSON();
        res.json(userData);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        const user = await User.findOne({
            where: { id, tenantId: req.user.tenantId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Owner protection: Check if this is the last super_admin
        const superAdminRole = await Role.findOne({ where: { name: 'super_admin', tenantId: req.user.tenantId } });
        if (superAdminRole && user.roleId === superAdminRole.id) {
            const superAdminCount = await User.count({ where: { roleId: superAdminRole.id, tenantId: req.user.tenantId } });
            if (superAdminCount <= 1) {
                return res.status(400).json({ error: 'At least one owner (super_admin) is required for admin access' });
            }
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.syncUsers = async (req, res) => {
    try {
        console.log('[SYNC USERS] Request from user:', req.user?.username, 'tenantId:', req.user?.tenantId);

        if (!req.user || !req.user.tenantId) {
            console.error('[SYNC USERS] Missing tenant ID');
            return res.status(400).json({ error: 'Tenant ID required for sync' });
        }

        const users = await User.findAll({
            where: { tenantId: req.user.tenantId },
            attributes: ['id', 'username', 'displayName', 'password', 'passcode', 'tenantId', 'roleId'],
            include: [{ model: Role, as: 'roleData', attributes: ['name', 'permissions'] }]
        });

        console.log('[SYNC USERS] Returning', users.length, 'users for tenant', req.user.tenantId);
        res.json(users);
    } catch (error) {
        console.error('[SYNC USERS ERROR]', error);
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
                    { subdomain: idOrSubdomain.toLowerCase() }
                ]
            }
        });

        if (!tenant) {
            console.log(`[INIT_DEBUG] Tenant not found for: "${idOrSubdomain}"`);
            return res.status(404).json({ error: 'Restaurant not found. Please verify the ID or Subdomain.' });
        }

        // FETCH FULL SYNC DATA DIRECTLY (SKIPPING OTP)
        console.log(`[INIT_DEBUG] Fetching sync payload for tenant: ${tenant.id}`);
        const payload = await getSyncPayload(tenant.id);
        console.log(`[INIT_DEBUG] Sync payload fetched successfully. Users: ${payload.users.length}, Items: ${payload.menu.items.length}`);

        res.json({
            ...payload,
            requiresOTP: false
        });
    } catch (error) {
        console.error(`[INIT_ERROR] Failed for "${req.params.idOrSubdomain}":`, error);
        res.status(500).json({ error: error.message });
    }
};

const getSyncPayload = async (tenantId) => {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const users = await User.findAll({
        where: { tenantId: tenant.id },
        attributes: ['id', 'username', 'displayName', 'password', 'passcode', 'tenantId', 'roleId'],
        include: [{ model: Role, as: 'roleData', attributes: ['name', 'permissions'] }]
    });

    const categories = await Category.findAll({ where: { tenantId: tenant.id } });
    const items = await Item.findAll({
        where: { tenantId: tenant.id },
        include: [
            { model: Variant },
            { model: AddonGroup, as: 'addonGroups', include: [Addon] },
            { model: VariationGroup, as: 'variationGroups', include: [Variant] }
        ]
    });

    const settings = await Setting.findAll({ where: { tenantId: tenant.id } });
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);

    return {
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
    };
};

exports.sendOTP = async (req, res) => {
    try {
        const { tenantId } = req.body;
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        const owner = await User.findOne({
            where: { tenantId: tenant.id },
            include: [{
                model: Role,
                as: 'roleData',
                where: { name: 'super_admin' }
            }],
            order: [['createdAt', 'ASC']]
        });

        if (!owner || !owner.email) {
            return res.status(400).json({ error: 'Admin email not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in memory for 10 minutes
        otpStore.set(tenant.id, {
            otp,
            expires: Date.now() + 10 * 60 * 1000
        });

        // REAL EMAIL SENDING
        await emailService.sendOTP(owner.email, otp, tenant.name);

        res.json({ message: `OTP sent to ${maskEmail(owner.email)}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { tenantId, otp } = req.body;

        const stored = otpStore.get(tenantId);
        if (!stored) return res.status(400).json({ error: 'OTP not requested or expired' });
        if (Date.now() > stored.expires) {
            otpStore.delete(tenantId);
            return res.status(400).json({ error: 'OTP expired' });
        }
        if (stored.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP Valid - Clear it
        otpStore.delete(tenantId);

        // Fetch full sync payload
        const payload = await getSyncPayload(tenantId);
        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [
                { model: Tenant },
                { model: Role, as: 'roleData' }
            ]
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return await sendLoginResponse(user, res);
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

        const userRole = user.roleData?.name || user.role;
        // Only Super Admin can login via Google
        if (userRole !== 'super_admin') {
            return res.redirect('http://localhost:5174/login?error=unauthorized_role');
        }

        const token = jwt.sign(
            { id: user.id, role: userRole, name: user.displayName },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Redirect to Web Admin with token
        res.redirect(`http://localhost:5174/login?token=${token}&username=${user.displayName}&role=${user.role}&id=${user.id}`);
    })(req, res, next);
};
