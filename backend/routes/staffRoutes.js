const express = require('express');
const { getStaff, addStaff, editStaff, removeStaff, paySalary, getSalaryHistory, getExpenses, addExpense, removeExpense } = require('../controllers/staffController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const router = express.Router();

// Base routes (no params)
router.get('/', protect, ownerOnly, getStaff);
router.post('/', protect, ownerOnly, addStaff);

// Expense routes - MUST come BEFORE parameterized routes to avoid "expenses" being treated as :id
router.get('/expenses', protect, ownerOnly, getExpenses);
router.post('/expenses', protect, ownerOnly, addExpense);
router.delete('/expenses/:id', protect, ownerOnly, removeExpense);

// Payment history route
router.get('/payments', protect, ownerOnly, getSalaryHistory);

// Parameterized routes - MUST come LAST
router.put('/:id', protect, ownerOnly, editStaff);
router.delete('/:id', protect, ownerOnly, removeStaff);
router.post('/:id/pay', protect, ownerOnly, paySalary);

module.exports = router;


