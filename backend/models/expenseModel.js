const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
        type: String,
        required: true,
        enum: ['GROCERY', 'GAS', 'ELECTRICITY', 'MAINTENANCE', 'OTHER'],
        default: 'OTHER'
    },
    // Store as YYYY-MM-DD string to avoid timezone issues
    dateStr: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
            // Map dateStr to date for frontend compatibility
            ret.date = ret.dateStr;
            delete ret.dateStr;
        }
    }
});

const Expense = mongoose.model('Expense', expenseSchema);

const { getTodayStr } = require('../utils/dateUtils'); // Import utils

// Helper functions

const createExpense = async (description, amount, category, createdBy, dateStr) => {
    // Helper now expects dateStr (YYYY-MM-DD)
    const todayStr = getTodayStr(); // Use centralized IST date

    return await Expense.create({
        description,
        amount,
        category,
        createdBy,
        dateStr: dateStr || todayStr
    });
};

const getAllExpenses = async () => {
    return await Expense.find().sort({ dateStr: -1 }).populate('createdBy', 'name');
};

const getExpensesByMonth = async (year, month) => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    return await Expense.find({
        dateStr: { $regex: `^${monthPrefix}` }
    }).sort({ dateStr: -1 }).populate('createdBy', 'name');
};

const getMonthlyTotal = async (year, month) => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const result = await Expense.aggregate([
        {
            $match: {
                dateStr: { $regex: `^${monthPrefix}` }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    return result.length > 0 ? result[0].total : 0;
};

const deleteExpense = async (id) => {
    return await Expense.findByIdAndDelete(id);
};

module.exports = {
    Expense,
    createExpense,
    getAllExpenses,
    getExpensesByMonth,
    getMonthlyTotal,
    deleteExpense
};
