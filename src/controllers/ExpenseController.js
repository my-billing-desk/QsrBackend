const { Expense, ExpenseCategory } = require('../models');
const { Op } = require('sequelize');

// --- Expense Categories ---

exports.getExpenseCategories = async (req, res) => {
    try {
        const categories = await ExpenseCategory.findAll({
            where: { tenantId: req.tenantId },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching expense categories:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createExpenseCategory = async (req, res) => {
    try {
        const { title, status } = req.body;
        const category = await ExpenseCategory.create({
            title,
            status,
            tenantId: req.tenantId
        });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('Error creating expense category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateExpenseCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await ExpenseCategory.findOne({ where: { id, tenantId: req.tenantId } });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.update(req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Error updating expense category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteExpenseCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await ExpenseCategory.findOne({ where: { id, tenantId: req.tenantId } });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.destroy();
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting expense category:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- Expenses ---

exports.getExpenses = async (req, res) => {
    try {
        const { startDate, endDate, title } = req.query;
        const where = { tenantId: req.tenantId };

        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        }

        if (title) {
            where.reason = { [Op.like]: `%${title}%` };
        }

        const expenses = await Expense.findAll({
            where,
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        res.json({ success: true, data: expenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createExpense = async (req, res) => {
    try {
        // Can accept single object or array of objects
        const data = req.body;
        let result;

        if (Array.isArray(data)) {
            const expenses = data.map(item => ({ ...item, tenantId: req.tenantId }));
            result = await Expense.bulkCreate(expenses);

            // Sync reasons to Master (ExpenseCategory)
            const reasons = [...new Set(data.map(i => i.reason))];
            for (const reason of reasons) {
                await ExpenseCategory.findOrCreate({
                    where: { title: reason, tenantId: req.tenantId },
                    defaults: { status: true }
                });
            }
        } else {
            result = await Expense.create({ ...data, tenantId: req.tenantId });
            // Sync reason to Master (ExpenseCategory)
            await ExpenseCategory.findOrCreate({
                where: { title: data.reason, tenantId: req.tenantId },
                defaults: { status: true }
            });
        }

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findOne({ where: { id, tenantId: req.tenantId } });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        await expense.destroy();
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteExpensesByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }
        await Expense.destroy({
            where: {
                date,
                tenantId: req.tenantId
            }
        });
        res.json({ success: true, message: `Expenses for ${date} deleted` });
    } catch (error) {
        console.error('Error deleting expenses by date:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getExpenseMaster = async (req, res) => {
    try {
        const { sequelize } = require('../models');

        // 1. Get usage stats
        const stats = await Expense.findAll({
            attributes: [
                ['reason', 'title'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'usageCount'],
                [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastUsed']
            ],
            where: { tenantId: req.tenantId },
            group: ['reason'],
            raw: true
        });

        // 2. Get categories (masters) to get status
        const categories = await ExpenseCategory.findAll({
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
                const [newCat] = await ExpenseCategory.findOrCreate({
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
        console.error('Error fetching expense master:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
