const { CashMovement, User } = require('../models');
const { Op } = require('sequelize');

// Record a cash in transaction
exports.cashIn = async (req, res) => {
    try {
        const {
            amount,
            reason,
            notes,
            referenceNumber,
            shiftId,
            deviceId,
            metadata
        } = req.body;

        const tenantId = req.user.tenantId;
        const performedBy = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }

        const cashMovement = await CashMovement.create({
            type: 'cash_in',
            amount,
            reason,
            notes,
            referenceNumber,
            performedBy,
            shiftId,
            deviceId,
            metadata,
            tenantId
        });

        // Get the movement with user info
        const movementWithUser = await CashMovement.findByPk(cashMovement.id, {
            include: [
                {
                    model: User,
                    as: 'performer',
                    attributes: ['id', 'username', 'displayName']
                }
            ]
        });

        res.status(201).json({
            message: 'Cash in recorded successfully',
            movement: movementWithUser
        });
    } catch (error) {
        console.error('Error recording cash in:', error);
        res.status(500).json({ error: 'Failed to record cash in' });
    }
};

// Record a cash out transaction
exports.cashOut = async (req, res) => {
    try {
        const {
            amount,
            reason,
            notes,
            referenceNumber,
            shiftId,
            deviceId,
            metadata,
            approvedBy
        } = req.body;

        const tenantId = req.user.tenantId;
        const performedBy = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }

        const cashMovement = await CashMovement.create({
            type: 'cash_out',
            amount,
            reason,
            notes,
            referenceNumber,
            performedBy,
            approvedBy: approvedBy || null,
            shiftId,
            deviceId,
            metadata,
            tenantId
        });

        // Get the movement with user info
        const movementWithUser = await CashMovement.findByPk(cashMovement.id, {
            include: [
                {
                    model: User,
                    as: 'performer',
                    attributes: ['id', 'username', 'displayName']
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'username', 'displayName'],
                    required: false
                }
            ]
        });

        res.status(201).json({
            message: 'Cash out recorded successfully',
            movement: movementWithUser
        });
    } catch (error) {
        console.error('Error recording cash out:', error);
        res.status(500).json({ error: 'Failed to record cash out' });
    }
};

// Get all cash movements
exports.getAllMovements = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { startDate, endDate, type, reason, deviceId } = req.query;

        const where = { tenantId };

        if (type) {
            where.type = type;
        }

        if (reason) {
            where.reason = reason;
        }

        if (deviceId) {
            where.deviceId = deviceId;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                where.createdAt[Op.lte] = new Date(endDate);
            }
        }

        const movements = await CashMovement.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'performer',
                    attributes: ['id', 'username', 'displayName']
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'username', 'displayName'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Calculate totals
        const cashInTotal = movements
            .filter(m => m.type === 'cash_in')
            .reduce((sum, m) => sum + parseFloat(m.amount), 0);

        const cashOutTotal = movements
            .filter(m => m.type === 'cash_out')
            .reduce((sum, m) => sum + parseFloat(m.amount), 0);

        res.json({
            movements,
            summary: {
                totalCashIn: cashInTotal,
                totalCashOut: cashOutTotal,
                netCashFlow: cashInTotal - cashOutTotal,
                count: movements.length
            }
        });
    } catch (error) {
        console.error('Error fetching cash movements:', error);
        res.status(500).json({ error: 'Failed to fetch cash movements' });
    }
};

// Get cash movement summary/report
exports.getSummary = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { startDate, endDate } = req.query;

        const where = { tenantId };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                where.createdAt[Op.lte] = new Date(endDate);
            }
        }

        const movements = await CashMovement.findAll({ where });

        // Group by reason
        const byReason = {};
        movements.forEach(movement => {
            const key = movement.reason;
            if (!byReason[key]) {
                byReason[key] = {
                    reason: key,
                    cashIn: 0,
                    cashOut: 0,
                    count: 0
                };
            }
            if (movement.type === 'cash_in') {
                byReason[key].cashIn += parseFloat(movement.amount);
            } else {
                byReason[key].cashOut += parseFloat(movement.amount);
            }
            byReason[key].count += 1;
        });

        const totalCashIn = movements
            .filter(m => m.type === 'cash_in')
            .reduce((sum, m) => sum + parseFloat(m.amount), 0);

        const totalCashOut = movements
            .filter(m => m.type === 'cash_out')
            .reduce((sum, m) => sum + parseFloat(m.amount), 0);

        res.json({
            summary: {
                totalCashIn,
                totalCashOut,
                netCashFlow: totalCashIn - totalCashOut,
                totalTransactions: movements.length
            },
            byReason: Object.values(byReason)
        });
    } catch (error) {
        console.error('Error fetching cash movement summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
};

// Delete a cash movement (admin only)
exports.deleteMovement = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const movement = await CashMovement.findOne({
            where: { id, tenantId }
        });

        if (!movement) {
            return res.status(404).json({ error: 'Cash movement not found' });
        }

        await movement.destroy();

        res.json({ message: 'Cash movement deleted successfully' });
    } catch (error) {
        console.error('Error deleting cash movement:', error);
        res.status(500).json({ error: 'Failed to delete cash movement' });
    }
};

module.exports = exports;
