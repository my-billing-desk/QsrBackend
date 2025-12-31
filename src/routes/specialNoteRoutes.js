const express = require('express');
const router = express.Router();
const specialNoteController = require('../controllers/specialNoteController');

const { protect, authorize } = require('../middleware/authMiddleware');

const managers = ['super_admin', 'admin', 'restaurant_manager'];

router.get('/', protect, specialNoteController.getAll);
router.post('/', protect, authorize(...managers), specialNoteController.create);
router.put('/:id', protect, authorize(...managers), specialNoteController.update);
router.delete('/:id', protect, authorize(...managers), specialNoteController.delete);
router.patch('/:id/toggle', protect, authorize(...managers), specialNoteController.toggleStatus);

module.exports = router;
