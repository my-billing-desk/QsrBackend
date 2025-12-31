const { Role, User } = require('../models');

exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            where: { tenantId: req.user.tenantId }
        });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const tenantId = req.user.tenantId;

        const role = await Role.create({
            name,
            description,
            permissions,
            tenantId
        });

        res.status(201).json(role);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, isActive } = req.body;

        const role = await Role.findOne({
            where: { id, tenantId: req.user.tenantId }
        });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        if (name) role.name = name;
        if (description) role.description = description;
        if (permissions) role.permissions = permissions;
        if (isActive !== undefined) role.isActive = isActive;

        await role.save();
        res.json(role);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if any users are assigned to this role
        const userCount = await User.count({ where: { roleId: id } });
        if (userCount > 0) {
            return res.status(400).json({ error: 'Cannot delete role with assigned users' });
        }

        const role = await Role.findOne({
            where: { id, tenantId: req.user.tenantId }
        });

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        await role.destroy();
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
