const express = require('express');
const router = express.Router();
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
    addIncome,
    getIncomeByMonth,
    getStats,
    editIncome,
    removeIncome,
    getValidDateRange
} = require('../controllers/sideIncomeController');

// All routes require authentication and owner role
router.use(protect);
router.use(ownerOnly);

// GET /api/side-income/date-range - Get valid date range for adding income
router.get('/date-range', getValidDateRange);

// GET /api/side-income/stats - Get monthly totals by category
router.get('/stats', getStats);

// GET /api/side-income - Get income by month (query: year, month, category)
router.get('/', getIncomeByMonth);

// POST /api/side-income - Add new income
router.post('/', addIncome);

// PUT /api/side-income/:id - Update income
router.put('/:id', editIncome);

// DELETE /api/side-income/:id - Delete income
router.delete('/:id', removeIncome);

module.exports = router;
