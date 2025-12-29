const { Op } = require('sequelize');
const { Outlet } = require('../models');

/**
 * Middleware to attach geographical and branch scopes to the request based on user role.
 * This ensures that a manager only sees data they are authorized for.
 */
const attachScope = async (req, res, next) => {
    if (!req.user) return next();

    const { role, assignedOutletId, assignedOutlets, assignedRegion, tenantId } = req.user;

    // Base filter: always restrict by Tenant
    let scopeQuery = { tenantId };

    try {
        switch (role) {
            case 'super_admin':
                // No scope filter needed (global access)
                req.branchScope = {};
                break;

            case 'admin':
                // Full tenant access
                req.branchScope = { tenantId };
                break;

            case 'zone_manager':
            case 'city_manager':
                // Regions could be { zone: 'North' } or { city: 'Bengaluru' }
                // We need to find all outlet IDs in that region first
                const regionFilter = { tenantId, ...assignedRegion };
                const outletsInRegion = await Outlet.findAll({
                    where: regionFilter,
                    attributes: ['id']
                });
                const regionIds = outletsInRegion.map(o => o.id);
                req.branchScope = {
                    [Op.or]: [
                        { tenantId }, // Primary tenant check
                    ],
                    outletId: { [Op.in]: regionIds }
                };
                // Simplified: many models have outletId or we filter the Outlets list
                req.assignedOutletIds = regionIds;
                break;

            case 'area_manager':
                // assignedOutlets is a JSON array: [1, 2, 5]
                const areaIds = Array.isArray(assignedOutlets) ? assignedOutlets : [];
                req.branchScope = { outletId: { [Op.in]: areaIds } };
                req.assignedOutletIds = areaIds;
                break;

            case 'restaurant_manager':
            case 'shift_manager':
            case 'cashier':
            case 'waiter':
                // Single outlet scope
                if (assignedOutletId) {
                    req.branchScope = { outletId: assignedOutletId };
                    req.assignedOutletIds = [assignedOutletId];
                } else {
                    // Fallback or error if no outlet assigned
                    req.branchScope = { outletId: -1 }; // Block access
                }
                break;

            default:
                req.branchScope = { tenantId };
        }

        next();
    } catch (error) {
        console.error('Scope Middleware Error:', error);
        res.status(500).json({ error: 'Internal Server Error during data scoping' });
    }
};

module.exports = { attachScope };
