const { Tenant } = require('../models');

const tenantResolver = async (req, res, next) => {
    try {
        // 1. Check Header (x-tenant-id)
        const tenantId = req.headers['x-tenant-id'];

        // 2. Check Subdomain (optional future enhancement)
        // const host = req.get('host');
        // const subdomain = host.split('.')[0]; 

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required (x-tenant-id)' });
        }

        const tenant = await Tenant.findByPk(tenantId);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        if (tenant.status !== 'active') {
            return res.status(403).json({ error: 'Tenant is not active' });
        }

        // Attach tenant to request
        req.tenant = tenant;
        next();
    } catch (error) {
        console.error('Tenant Resolution Error:', error);
        res.status(500).json({ error: 'Internal Server Error during tenant resolution' });
    }
};

module.exports = tenantResolver;
