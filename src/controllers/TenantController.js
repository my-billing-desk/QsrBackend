const { Tenant, User, Setting } = require('../models');
const bcrypt = require('bcryptjs');

exports.getSubTenants = async (req, res) => {
    try {
        // Enforce Master Only
        const currentTenant = await Tenant.findByPk(req.tenantId);
        if (currentTenant.role !== 'MASTER') {
            return res.status(403).json({ error: 'Only Master Tenant can view sub-tenants' });
        }

        const subTenants = await Tenant.findAll({
            where: {
                parentTenantId: req.tenantId,
                role: 'SUB'
            }
        });
        res.json(subTenants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSubTenant = async (req, res) => {
    try {
        const { name, subdomain, ownerEmail, ownerPassword, fssaiNumber, royaltyPercentage } = req.body;

        // Enforce Master Only
        const currentTenant = await Tenant.findByPk(req.tenantId);
        if (currentTenant.role !== 'MASTER') {
            return res.status(403).json({ error: 'Only Master Tenant can create sub-tenants' });
        }

        // 1. Create Tenant
        const newTenant = await Tenant.create({
            name,
            subdomain,
            role: 'SUB',
            parentTenantId: req.tenantId,
            fssaiNumber,
            royaltyPercentage: royaltyPercentage || 10.0,
            status: 'active'
        });

        // 2. Create Admin User for that Tenant
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);
        await User.create({
            username: ownerEmail, // Simple default
            email: ownerEmail,
            password: hashedPassword,
            role: 'super_admin',
            displayName: `${name} Admin`,
            tenantId: newTenant.id
        });

        // 3. Optional: Create Default Settings?
        await Setting.create({ key: 'site_title', value: name, tenantId: newTenant.id });

        res.status(201).json(newTenant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateSubTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { fssaiNumber, royaltyPercentage, status } = req.body;

        // Ensure this sub-tenant belongs to us
        const subTenant = await Tenant.findOne({
            where: { id, parentTenantId: req.tenantId }
        });

        if (!subTenant) return res.status(404).json({ error: 'Franchise not found' });

        await subTenant.update({ fssaiNumber, royaltyPercentage, status });

        res.json(subTenant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
