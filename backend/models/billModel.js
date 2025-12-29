const mongoose = require('mongoose');

const billSchema = mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    rebateAmount: { type: Number, default: 0.00 },
    finalAmount: { type: Number, required: true },
    status: { type: String, default: 'PENDING' },
    breakdown: { type: Object }, // JSONB in SQL -> Object in Mongo
    generatedAt: { type: Date, default: Date.now },
    paymentReference: { type: String },
    paidAt: { type: Date }
}, {
    timestamps: false,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc, ret) {
            delete ret._id;
        }
    }
});

const Bill = mongoose.model('Bill', billSchema);

const createBill = async (billData) => {
    // Mongoose create returns the document
    return await Bill.create(billData);
};

const getAllBills = async () => {
    return await Bill.find()
        .populate('studentId', 'name mobile')
        .sort({ generatedAt: -1 });
};

const getStudentBills = async (studentId) => {
    return await Bill.find({ studentId }).sort({ generatedAt: -1 });
};

const markBillPaid = async (billId, transactionRef) => {
    return await Bill.findByIdAndUpdate(
        billId,
        { status: 'PAID', paidAt: new Date(), paymentReference: transactionRef },
        { new: true }
    );
};

module.exports = { Bill, createBill, getAllBills, getStudentBills, markBillPaid };