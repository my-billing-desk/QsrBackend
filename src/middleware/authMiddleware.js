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
            // console.log('[AUTH DEBUG] Decoded:', decoded);

            // Get user from token
            const { Role } = require('../models');
            req.user = await User.findByPk(decoded.id, {
                attributes: ['id', 'username', 'email', 'tenantId', 'roleId'],
                include: [{ model: Role, as: 'roleData', attributes: ['name'] }]
            });

            if (!req.user) {
                console.error('[AUTH ERROR] User not found for ID:', decoded.id);
                return res.status(401).json({ error: 'User not found' });
            }

            // Map the Role table name to req.user.role for backward compatibility with authorize middleware
            if (req.user.roleData) {
                req.user.role = req.user.roleData.name;
            } else {
                // Special case for existing super_admins who might not have a roleId yet
                // Or we can fallback to 'guest'
                req.user.role = 'guest';
            }

            // First preference: Use tenantId from the user object (most reliable source of truth)
            let tenantId = req.user.tenantId;

            // Second preference: Use tenantId from the token payload if not in user object
            if (!tenantId && decoded.tenantId) {
                tenantId = decoded.tenantId;
            }

            if (tenantId) {
                // If we found a tenantId, apply the same check for active status
                // Optimization: Maybe cache tenant status or skip if critical, but for now we follow the pattern
                const tenant = await Tenant.findByPk(tenantId);
                if (!tenant || tenant.status !== 'active') {
                    // Allow 'trial' status as well
                    if (tenant && tenant.status !== 'trial') {
                        console.warn('[AUTH WARNING] Tenant inactive/missing:', tenantId);
                        return res.status(403).json({ error: 'Tenant inactive or not found' });
                    }
                }

                req.tenantId = tenantId;
                // Backfill user object just in case
                if (!req.user.tenantId) {
                    req.user.tenantId = tenantId;
                }
            } else {
                // console.warn(`[AUTH] No tenantId found for user ${req.user.username} (ID: ${req.user.id})`);
            }

            next();
        } catch (error) {
            console.error('[AUTH ERROR] Token Verification Failed:', error.message);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.warn('[AUTH WARNING] No Token Provided');
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            console.warn(`[AUTH FORBIDDEN] User ${req.user.username} (Role: ${req.user.role}) tried to access protected route requiring: ${roles.join(', ')}`);
            return res.status(403).json({
                error: 'User is not authorized to access this resource',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
