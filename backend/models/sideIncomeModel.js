const mongoose = require('mongoose');
const { getTodayStr, getISTDate } = require('../utils/dateUtils');

const sideIncomeSchema = mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['SNACKS', 'PANI_PURI', 'CUSTOM']
    },
    amount: { type: Number, required: true },
    description: { type: String, default: '' }, // Required for CUSTOM category
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

const SideIncome = mongoose.model('SideIncome', sideIncomeSchema);

// Helper function - always returns true for past dates (no restriction)
const isWithinEditWindow = (dateStr) => {
    // No restriction - can edit any past date
    const todayStr = getTodayStr();
    return dateStr <= todayStr;
};

const isFutureDate = (dateStr) => {
    const todayStr = getTodayStr();
    return dateStr > todayStr;
};

// Create side income entry
const createSideIncome = async (category, amount, description, createdBy, dateStr) => {
    const todayStr = getTodayStr();
    const targetDate = dateStr || todayStr;

    // Validate date is not in future
    if (isFutureDate(targetDate)) {
        throw new Error('Cannot add income for future dates');
    }

    return await SideIncome.create({
        category,
        amount,
        description,
        createdBy,
        dateStr: targetDate
    });
};

// Get side income by month and optional category
const getSideIncomeByMonth = async (year, month, category = null) => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const query = {
        dateStr: { $regex: `^${monthPrefix}` }
    };

    if (category) {
        query.category = category;
    }

    return await SideIncome.find(query)
        .sort({ dateStr: -1 })
        .populate('createdBy', 'name');
};

// Get monthly totals by category
const getMonthlyTotals = async (year, month) => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const result = await SideIncome.aggregate([
        {
            $match: {
                dateStr: { $regex: `^${monthPrefix}` }
            }
        },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    // Convert to more usable format
    const totals = {
        SNACKS: { total: 0, count: 0 },
        PANI_PURI: { total: 0, count: 0 },
        CUSTOM: { total: 0, count: 0 },
        grandTotal: 0
    };

    result.forEach(item => {
        totals[item._id] = { total: item.total, count: item.count };
        totals.grandTotal += item.total;
    });

    return totals;
};

// Update side income
const updateSideIncome = async (id, updates, userId) => {
    const income = await SideIncome.findById(id);

    if (!income) {
        throw new Error('Income entry not found');
    }

    // If updating date, validate new date is not in future
    if (updates.dateStr) {
        if (isFutureDate(updates.dateStr)) {
            throw new Error('Cannot set income date to future');
        }
    }

    return await SideIncome.findByIdAndUpdate(id, updates, { new: true });
};

// Delete side income
const deleteSideIncome = async (id) => {
    const income = await SideIncome.findById(id);

    if (!income) {
        throw new Error('Income entry not found');
    }

    return await SideIncome.findByIdAndDelete(id);
};

// Get single income by ID
const getSideIncomeById = async (id) => {
    return await SideIncome.findById(id).populate('createdBy', 'name');
};

module.exports = {
    SideIncome,
    isWithinEditWindow,
    isFutureDate,
    createSideIncome,
    getSideIncomeByMonth,
    getMonthlyTotals,
    updateSideIncome,
    deleteSideIncome,
    getSideIncomeById
};
