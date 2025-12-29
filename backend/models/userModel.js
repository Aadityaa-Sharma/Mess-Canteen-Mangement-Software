const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: false }, // Made optional as per SQL schema nullable
    mobile: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ['OWNER', 'STUDENT', 'MANAGER'],
    },
    status: { type: String, default: 'ACTIVE' },

    // Financial Configuration
    monthlyFee: { type: Number, default: 0.00 },
    paymentMode: { type: String, default: 'PREPAID' },
    dailyRate: { type: Number, default: 0.00 },

    // Rebate Logic
    rebateEligible: { type: Boolean, default: false },
    rebateAmountPerMeal: { type: Number, default: 0.00 },

    // Mess Specific
    messType: { type: String, default: 'STANDARD' },
    // Store as YYYY-MM-DD string to avoid timezone issues
    joinedAt: { type: String },
    mealsPerDay: { type: Number, default: 2 },
    mealSlot: {
        type: String,
        enum: ['AFTERNOON', 'NIGHT', 'BOTH'],
        default: 'BOTH'
    }, // Determines free holiday quota: BOTH=2, NIGHT=2, AFTERNOON=0
    advanceBalance: { type: Number, default: 0 },

    // Meta
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
            delete ret.passwordHash;
        }
    },
    toObject: { virtuals: true }
});

// Partial unique index: allows duplicates if they are marked as deleted
userSchema.index({ mobile: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

const User = mongoose.model('User', userSchema);

// Helper functions to match previous API surface as much as possible

const findUserByMobile = async (mobile) => {
    return await User.findOne({ mobile, isDeleted: false });
};

const findUserById = async (id) => {
    return await User.findById(id);
};

const createUser = async (userData) => {
    const user = new User(userData);
    return await user.save();
};

const getAllStudents = async () => {
    return await User.find({ role: 'STUDENT', isDeleted: false }).sort({ name: 1 });
};

const updateUser = async (id, updates) => {
    return await User.findByIdAndUpdate(id, updates, { new: true });
};

const deleteUser = async (id) => {
    return await User.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true });
};

module.exports = {
    User,
    findUserByMobile,
    findUserById,
    createUser,
    getAllStudents,
    updateUser,
    deleteUser
};