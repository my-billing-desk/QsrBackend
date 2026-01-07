const { CashTopUp, CashTopUpCategory } = require('../models');
const { Op } = require('sequelize');

// --- CashTopUp Categories ---

exports.getCashTopUpCategories = async (req, res) => {
    try {
        const categories = await CashTopUpCategory.findAll({
            where: { tenantId: req.tenantId },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching cash top-up categories:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createCashTopUpCategory = async (req, res) => {
    try {
        const { title, status } = req.body;
        const category = await CashTopUpCategory.create({
            title,
            status,
            tenantId: req.tenantId
        });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('Error creating cash top-up category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateCashTopUpCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CashTopUpCategory.findOne({ where: { id, tenantId: req.tenantId } });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.update(req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Error updating cash top-up category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteCashTopUpCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CashTopUpCategory.findOne({ where: { id, tenantId: req.tenantId } });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.destroy();
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting cash top-up category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- CashTopUps ---

exports.getCashTopUps = async (req, res) => {
    try {
        const { startDate, endDate, title } = req.query;
        const where = { tenantId: req.tenantId };

        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        }

        if (title) {
            where.title = { [Op.like]: `%${title}%` };
        }

        const topUps = await CashTopUp.findAll({
            where,
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json({ success: true, data: topUps });
    } catch (error) {
        console.error('Error fetching cash top-ups:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createCashTopUp = async (req, res) => {
    try {
        const topUp = await CashTopUp.create({
            ...req.body,
            tenantId: req.tenantId
        });

        // Sync title to Master (CashTopUpCategory)
        await CashTopUpCategory.findOrCreate({
            where: { title: req.body.title, tenantId: req.tenantId },
            defaults: { status: true }
        });

        res.status(201).json({ success: true, data: topUp });
    } catch (error) {
        console.error('Error creating cash top-up:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteCashTopUp = async (req, res) => {
    try {
        const { id } = req.params;
        const topUp = await CashTopUp.findOne({ where: { id, tenantId: req.tenantId } });

        if (!topUp) {
            return res.status(404).json({ success: false, message: 'Cash top-up not found' });
        }

        await topUp.destroy();
        res.json({ success: true, message: 'Cash top-up deleted' });
    } catch (error) {
        console.error('Error deleting cash top-up:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getCashTopUpMaster = async (req, res) => {
    try {
        const { sequelize } = require('../models');

        // 1. Get usage stats
        const stats = await CashTopUp.findAll({
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
        const categories = await CashTopUpCategory.findAll({
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
                const [newCat] = await CashTopUpCategory.findOrCreate({
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
        console.error('Error fetching cash top-up master:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
