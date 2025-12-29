const express = require('express');
const { getHolidays, addHoliday, deleteHoliday } = require('../controllers/holidayController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getHolidays);
router.post('/', protect, ownerOnly, addHoliday);
router.delete('/:id', protect, ownerOnly, deleteHoliday);

module.exports = router;
