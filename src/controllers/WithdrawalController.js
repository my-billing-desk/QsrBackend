const { Withdrawal, WithdrawalCategory } = require('../models');
const { Op } = require('sequelize');

// --- Withdrawal Categories ---

exports.getWithdrawalCategories = async (req, res) => {
    try {
        const categories = await WithdrawalCategory.findAll({
            where: { tenantId: req.tenantId },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching withdrawal categories:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createWithdrawalCategory = async (req, res) => {
    try {
        const { title, status } = req.body;
        const category = await WithdrawalCategory.create({
            title,
            status,
            tenantId: req.tenantId
        });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('Error creating withdrawal category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateWithdrawalCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await WithdrawalCategory.findOne({ where: { id, tenantId: req.tenantId } });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.update(req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Error updating withdrawal category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteWithdrawalCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await WithdrawalCategory.findOne({ where: { id, tenantId: req.tenantId } });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.destroy();
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting withdrawal category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- Withdrawals ---

exports.getWithdrawals = async (req, res) => {
    try {
        const { startDate, endDate, title } = req.query;
        const where = { tenantId: req.tenantId };

        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        }

        if (title) {
            where.title = { [Op.like]: `%${title}%` };
        }

        const withdrawals = await Withdrawal.findAll({
            where,
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json({ success: true, data: withdrawals });
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createWithdrawal = async (req, res) => {
    try {
        const withdrawal = await Withdrawal.create({
            ...req.body,
            tenantId: req.tenantId
        });

        // Sync title to Master (WithdrawalCategory)
        await WithdrawalCategory.findOrCreate({
            where: { title: req.body.title, tenantId: req.tenantId },
            defaults: { status: true }
        });

        res.status(201).json({ success: true, data: withdrawal });
    } catch (error) {
        console.error('Error creating withdrawal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const withdrawal = await Withdrawal.findOne({ where: { id, tenantId: req.tenantId } });

        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }

        await withdrawal.destroy();
        res.json({ success: true, message: 'Withdrawal deleted' });
    } catch (error) {
        console.error('Error deleting withdrawal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getWithdrawalMaster = async (req, res) => {
    try {
        const { sequelize } = require('../models');

        // 1. Get usage stats
        const stats = await Withdrawal.findAll({
            attributes: [
                ['title', 'title'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount'],
                [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastUsed']
            ],
            where: { tenantId: req.tenantId },
            group: ['title'],
            raw: true
        });

        // 2. Get categories (masters) to get status
        const categories = await WithdrawalCategory.findAll({
            where: { tenantId: req.tenantId },
            raw: true
        });

        // 3. Merge
        const masters = categories.map(cat => {
            const stat = stats.find(s => s.title === cat.title);
            return {
                id: cat.id,
                title: cat.title,
                status: cat.status,
                usageCount: stat ? stat.usageCount : 0,
                lastUsed: stat ? stat.lastUsed : null
            };
        });

        // Add any missing ones to DB and masters
        for (const s of stats) {
            if (!masters.find(m => m.title === s.title)) {
                const [newCat] = await WithdrawalCategory.findOrCreate({
                    where: { title: s.title, tenantId: req.tenantId },
                    defaults: { status: true }
                });
                masters.push({
                    id: newCat.id,
                    title: newCat.title,
                    status: newCat.status,
                    usageCount: s.usageCount,
                    lastUsed: s.lastUsed
                });
            }
        }

        res.json({ success: true, data: masters.sort((a, b) => b.usageCount - a.usageCount) });
    } catch (error) {
        console.error('Error fetching withdrawal master:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
