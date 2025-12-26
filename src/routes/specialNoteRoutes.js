const express = require('express');
const router = express.Router();
const specialNoteController = require('../controllers/specialNoteController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, specialNoteController.getAll);
router.post('/', protect, specialNoteController.create);
router.put('/:id', protect, specialNoteController.update);
router.delete('/:id', protect, specialNoteController.delete);
router.patch('/:id/toggle', protect, specialNoteController.toggleStatus);

module.exports = router;
