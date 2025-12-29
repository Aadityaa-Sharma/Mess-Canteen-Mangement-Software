const {
    createSideIncome,
    getSideIncomeByMonth,
    getMonthlyTotals,
    updateSideIncome,
    deleteSideIncome,
    getSideIncomeById,
    isWithinEditWindow
} = require('../models/sideIncomeModel');
const { getTodayStr } = require('../utils/dateUtils');

// Add new side income entry
const addIncome = async (req, res) => {
    try {
        const { category, amount, description, date } = req.body;

        if (!category || !amount) {
            return res.status(400).json({ message: 'Category and amount are required' });
        }

        // Validate custom category has description
        if (category === 'CUSTOM' && !description) {
            return res.status(400).json({ message: 'Description is required for custom income' });
        }

        const income = await createSideIncome(
            category,
            parseFloat(amount),
            description || '',
            req.user._id,
            date
        );

        res.status(201).json(income);
    } catch (error) {
        console.error('Add side income error:', error);
        res.status(400).json({ message: error.message || 'Failed to add income' });
    }
};

// Get income by month (and optional category)
const getIncomeByMonth = async (req, res) => {
    try {
        const today = new Date();
        const year = parseInt(req.query.year) || today.getFullYear();
        const month = parseInt(req.query.month) || today.getMonth() + 1;
        const category = req.query.category || null;

        const income = await getSideIncomeByMonth(year, month, category);

        // Add editable flag to each entry
        const incomeWithEditFlag = income.map(item => {
            const itemObj = item.toJSON();
            itemObj.editable = isWithinEditWindow(item.dateStr);
            return itemObj;
        });

        res.json({ income: incomeWithEditFlag });
    } catch (error) {
        console.error('Get side income error:', error);
        res.status(500).json({ message: 'Failed to fetch income' });
    }
};

// Get monthly stats
const getStats = async (req, res) => {
    try {
        const today = new Date();
        const year = parseInt(req.query.year) || today.getFullYear();
        const month = parseInt(req.query.month) || today.getMonth() + 1;

        const totals = await getMonthlyTotals(year, month);

        res.json(totals);
    } catch (error) {
        console.error('Get side income stats error:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

// Update income entry
const editIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, date, category } = req.body;

        const updates = {};
        if (amount !== undefined) updates.amount = parseFloat(amount);
        if (description !== undefined) updates.description = description;
        if (date !== undefined) updates.dateStr = date;
        if (category !== undefined) updates.category = category;

        const income = await updateSideIncome(id, updates, req.user._id);

        res.json(income);
    } catch (error) {
        console.error('Update side income error:', error);
        res.status(400).json({ message: error.message || 'Failed to update income' });
    }
};

// Delete income entry
const removeIncome = async (req, res) => {
    try {
        const { id } = req.params;

        await deleteSideIncome(id);

        res.json({ message: 'Income deleted successfully' });
    } catch (error) {
        console.error('Delete side income error:', error);
        res.status(400).json({ message: error.message || 'Failed to delete income' });
    }
};

// Get valid date range for adding income
const getValidDateRange = async (req, res) => {
    try {
        const todayStr = getTodayStr();
        const today = new Date(todayStr + 'T00:00:00+05:30');
        const minDate = new Date(today);
        minDate.setFullYear(minDate.getFullYear() - 1); // Allow up to 1 year back

        const minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;

        res.json({
            minDate: minDateStr,
            maxDate: todayStr
        });
    } catch (error) {
        console.error('Get date range error:', error);
        res.status(500).json({ message: 'Failed to get date range' });
    }
};

module.exports = {
    addIncome,
    getIncomeByMonth,
    getStats,
    editIncome,
    removeIncome,
    getValidDateRange
};
