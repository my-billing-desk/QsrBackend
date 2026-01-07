const { User, Tenant, PosDevice, Category, Item, Setting, Variant, Addon, AddonGroup, ItemAddonGroup, VariationGroup, ItemVariationGroup } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.login = async (req, res) => {
    try {
        let { username, password, email, tenantId, subdomain, passcode } = req.body;

        // Handle Passcode Login
        if (passcode) {
            if (!tenantId) {
                return res.status(400).json({ error: 'Tenant ID required for passcode login' });
            }

            // Direct lookup using unique passcode
            const foundUser = await User.findOne({
                where: {
                    tenantId,
                    passcode: passcode
                },
                include: [{ model: Tenant }]
            });

            if (!foundUser) {
                return res.status(401).json({ error: 'Invalid Passcode' });
            }

            // Proceed as logged in
            const token = jwt.sign(
                { id: foundUser.id, role: foundUser.role, name: foundUser.displayName, tenantId: foundUser.tenantId },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: {
                    id: foundUser.id,
                    username: foundUser.username,
                    role: foundUser.role,
                    name: foundUser.displayName,
                    tenantId: foundUser.tenantId,
                    tenantName: foundUser.Tenant?.name
                }
            });
        }



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

exports.me = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Tenant }]
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.initTerminal = async (req, res) => {
    try {
        const { id } = req.params; // This is the Tenant ID or Subdomain provided by POS

        // Try to find tenant by ID or Subdomain
        const tenant = await Tenant.findOne({
            where: {
                [Op.or]: [
                    { id: id },
                    { subdomain: id }
                ]
            }
        });

        if (!tenant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        if (tenant.status !== 'active') {
            return res.status(403).json({ error: 'Restaurant account is inactive' });
        }

        // If we are skipping OTP (development mode or configured), return full data needed for sync
        const SKIP_OTP = true; // Hardcoded for requested bypass

        if (SKIP_OTP) {
            // Gather Data for Sync (Same as verifyOTP)
            const users = await User.findAll({
                where: { tenantId: tenant.id },
                attributes: { exclude: ['password'] }
            });

            // Fetch Menu
            const categories = await Category.findAll({ where: { tenantId: tenant.id } });
            const items = await Item.findAll({
                where: { tenantId: tenant.id },
                include: [
                    { model: Variant },
                    { model: AddonGroup, as: 'addonGroups', include: [Addon] }
                ]
            });

            const settingsList = await Setting.findAll({ where: { tenantId: tenant.id } });
            const settings = {};
            settingsList.forEach(s => settings[s.key] = s.value);

            return res.json({
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
                settings,
                requiresOTP: false
            });
        }

        // Get Owner Email for partial masking (for OTP confirmation UI)
        const owner = await User.findOne({
            where: {
                tenantId: tenant.id,
                role: 'super_admin' // Assuming super_admin is the owner
            }
        });

        const ownerEmail = owner ? owner.email.replace(/(.{2})(.*)(?=@)/,
            (gp1, gp2, gp3) => {
                for (let i = 0; i < gp3.length; i++) {
                    gp2 += "*";
                }
                return gp2;
            }) : '******@***.com';


        res.json({
            tenant: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain
            },
            ownerEmail,
            requiresOTP: false // OTP Skipped for now
        });
    } catch (error) {
        console.error('Init Terminal Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { tenantId } = req.body;
        const tenant = await Tenant.findByPk(tenantId);

        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        tenant.otp = otp;
        tenant.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await tenant.save();

        // In production, send via Email/SMS
        console.log(`[OTP] Sent to tenant ${tenant.name}: ${otp}`);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { tenantId, otp } = req.body;
        const tenant = await Tenant.findByPk(tenantId);

        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        if (tenant.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > tenant.otpExpiresAt) {
            return res.status(400).json({ error: 'OTP Expired' });
        }

        // Clear OTP
        tenant.otp = null;
        tenant.otpExpiresAt = null;
        await tenant.save();

        // Gather Data for Sync
        const users = await User.findAll({
            where: { tenantId },
            attributes: { exclude: ['password'] }
        });

        // Fetch Menu
        const categories = await Category.findAll({ where: { tenantId } });
        const items = await Item.findAll({
            where: { tenantId },
            include: [
                { model: Variant },
                { model: AddonGroup, as: 'addonGroups', include: [Addon] }
            ]
        });

        const settingsList = await Setting.findAll({ where: { tenantId } });
        const settings = {};
        settingsList.forEach(s => settings[s.key] = s.value);

        res.json({
            message: 'Verified',
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
            settings
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ error: error.message });
    }
};
