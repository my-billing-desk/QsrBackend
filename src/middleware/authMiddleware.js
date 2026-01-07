const jwt = require('jsonwebtoken');
const { User, Tenant } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

            // Get user from token
            req.user = await User.findByPk(decoded.id, {
                attributes: ['id', 'username', 'email', 'role', 'tenantId']
            });

            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // check if tenant is active
            if (req.user.tenantId) {
                const tenant = await Tenant.findByPk(req.user.tenantId);
                if (!tenant || tenant.status !== 'active') {
                    return res.status(403).json({ error: 'Tenant inactive or not found' });
                }
                req.tenantId = req.user.tenantId; // Shortcut for controllers
            } else {
                // Fallback for Super Admin (global) or legacy users?
                // For now, let's allow it but warn or handle in controllers
            }

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
            console.error('Token:', token);
            res.status(401).json({ error: 'Not authorized, token failed', details: error.message });
        }
    }

    if (!token) {
        // Optional: If you want to allow public access for some routes, you handle that in the route definition or a separate middleware.
        // For 'protect', we assume stricter rules.
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

module.exports = { protect };
