const { SpecialNote, sequelize } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const notes = await SpecialNote.findAll({
            order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const note = await SpecialNote.create(req.body);
        res.status(201).json(note);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await SpecialNote.findByPk(id);
        if (!note) return res.status(404).json({ error: 'Note not found' });

        await note.update(req.body);
        res.json(note);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await SpecialNote.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await SpecialNote.findByPk(id);
        if (!note) return res.status(404).json({ error: 'Note not found' });

        await note.update({ isAvailable: !note.isAvailable });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
