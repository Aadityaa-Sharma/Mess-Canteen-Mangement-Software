const mongoose = require('mongoose');

const mealRequestSchema = mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    mealType: {
        type: String,
        enum: ['LUNCH', 'DINNER'],
        required: false
    },
    isSkipped: { type: Boolean, default: true },
    approved: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Calculate rebate eligibility on save? Or just store data.
// Keeping it simple as per SQL schema.

const MealRequest = mongoose.model('MealRequest', mealRequestSchema);

module.exports = { MealRequest };
