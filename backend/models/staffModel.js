const mongoose = require('mongoose');

const staffSchema = mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    salary: { type: Number, required: true },
    status: { type: String, default: 'ACTIVE' }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
        }
    }
});

const Staff = mongoose.model('Staff', staffSchema);

const staffPaymentSchema = mongoose.Schema({
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    amount: { type: Number, required: true },
    // Store as YYYY-MM-DD string
    paymentDateStr: { type: String, required: true }
}, {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
            ret.paymentDate = ret.paymentDateStr;
            delete ret.paymentDateStr;
        }
    }
});

const StaffPayment = mongoose.model('StaffPayment', staffPaymentSchema);


const { getTodayStr, getISTDate } = require('../utils/dateUtils'); // Import utils

// Helpers

const createStaff = async (name, role, salary) => {
    return await Staff.create({ name, role, salary });
};

const getAllStaff = async () => {
    return await Staff.find().sort({ created_at: -1 });
};

const updateStaff = async (id, name, role, salary, status) => {
    return await Staff.findByIdAndUpdate(
        id,
        { name, role, salary, status },
        { new: true }
    );
};

const deleteStaff = async (id) => {
    await Staff.findByIdAndDelete(id);
};

const recordSalaryPayment = async (staffId, amount) => {
    // Check if payment already exists for this staff in the current month
    const now = getISTDate();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayStr = getTodayStr();

    const existingPayment = await StaffPayment.findOne({
        staffId,
        paymentDateStr: { $regex: `^${monthPrefix}` }
    });

    if (existingPayment) {
        const monthName = now.toLocaleString('default', { month: 'long' });
        const error = new Error(`Salary already paid for ${monthName} ${now.getFullYear()}`);
        error.statusCode = 400;
        throw error;
    }

    return await StaffPayment.create({
        staffId,
        amount,
        paymentDateStr: todayStr
    });
};

const getStaffPaymentHistory = async () => {
    // Join with Staff
    const payments = await StaffPayment.find().sort({ paymentDateStr: -1 }).populate('staffId', 'name');
    // Transform to match SQL result structure expected by frontend usually
    // SQL: sp.*, s.name as staff_name
    return payments.map(p => ({
        ...p.toObject(),
        staff_name: p.staffId ? p.staffId.name : 'Unknown'
    }));
};

module.exports = {
    Staff,
    StaffPayment,
    createStaff,
    getAllStaff,
    updateStaff,
    deleteStaff,
    recordSalaryPayment,
    getStaffPaymentHistory
};
