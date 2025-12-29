const asyncHandler = require('../utils/asyncHandler');
const { createStaff, getAllStaff, updateStaff, deleteStaff, recordSalaryPayment, getStaffPaymentHistory } = require('../models/staffModel');
const { createExpense, getAllExpenses, getExpensesByMonth, getMonthlyTotal, deleteExpense } = require('../models/expenseModel');


const { getTodayStr, getISTDate } = require('../utils/dateUtils'); // Import new utils

// Removed local getISTDate helper in favor of centralized utility
// IST is UTC+5:30 (handled in dateUtils now)

const getStaff = asyncHandler(async (req, res) => {
    const staff = await getAllStaff();
    res.json(staff);
});

const addStaff = asyncHandler(async (req, res) => {
    const { name, role, salary } = req.body;
    const newStaff = await createStaff(name, role, salary);
    res.status(201).json(newStaff);
});

const editStaff = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, role, salary, status } = req.body;
    const updatedStaff = await updateStaff(id, name, role, salary, status);
    res.json(updatedStaff);
});

const removeStaff = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await deleteStaff(id);
    res.json({ message: 'Staff removed' });
});

const paySalary = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    try {
        const payment = await recordSalaryPayment(id, amount);
        res.json(payment);
    } catch (error) {
        res.status(error.statusCode || 500);
        throw error;
    }
});

const getSalaryHistory = asyncHandler(async (req, res) => {
    const history = await getStaffPaymentHistory();
    res.json(history);
});

// Expense Controllers
const getExpenses = asyncHandler(async (req, res) => {
    const { year, month } = req.query;

    let expenses;
    let total = 0;

    if (year && month) {
        expenses = await getExpensesByMonth(parseInt(year), parseInt(month));
        total = await getMonthlyTotal(parseInt(year), parseInt(month));
    } else {
        expenses = await getAllExpenses();
        // Calculate total for all expenses
        total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }

    res.json({ expenses, total });
});

const addExpense = asyncHandler(async (req, res) => {
    const { description, amount, category, date } = req.body;

    if (!description || !amount) {
        res.status(400);
        throw new Error('Description and amount are required');
    }

    // Use provided date string (YYYY-MM-DD) or generate today's string
    const todayStr = getTodayStr();
    const expenseDateStr = date || todayStr;

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDateStr)) {
        res.status(400);
        throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Validate: Cannot be in the future (String comparison is safe for YYYY-MM-DD)
    if (expenseDateStr > todayStr) {
        res.status(400);
        throw new Error(`Expense date cannot be in the future. Today is ${todayStr}`);
    }

    const expense = await createExpense(
        description,
        parseFloat(amount),
        category || 'OTHER',
        req.user._id,
        expenseDateStr
    );

    res.status(201).json(expense);
});

const removeExpense = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await deleteExpense(id);
    res.json({ message: 'Expense deleted' });
});

module.exports = {
    getStaff, addStaff, editStaff, removeStaff, paySalary, getSalaryHistory,
    getExpenses, addExpense, removeExpense
};

