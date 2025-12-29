const express = require('express');
const router = express.Router();
const {
    markBatchAttendance,
    getDailyAttendance,
    getStudentsForDate,
    getStudentHistory,
    getMissingDates
} = require('../controllers/attendanceController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');

// All attendance routes are protected and owner only
router.post('/', protect, ownerOnly, markBatchAttendance);
router.get('/', protect, ownerOnly, getDailyAttendance);
router.get('/students', protect, ownerOnly, getStudentsForDate);
router.get('/history', protect, ownerOnly, getStudentHistory);
router.get('/missing', protect, ownerOnly, getMissingDates);

module.exports = router;
