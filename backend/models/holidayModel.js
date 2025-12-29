const mongoose = require('mongoose');

const holidaySchema = mongoose.Schema({
    name: { type: String, required: true },
    // Store as YYYY-MM-DD string to avoid timezone issues
    dateStr: { type: String, required: true, unique: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

const Holiday = mongoose.model('Holiday', holidaySchema);

const getHolidays = async (year, month) => {
    let query = {};

    if (year && month) {
        // Match dates starting with YYYY-MM
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        query.dateStr = { $regex: `^${monthPrefix}` };
    } else if (year) {
        // Match dates starting with YYYY
        query.dateStr = { $regex: `^${year}` };
    }

    return await Holiday.find(query).sort({ dateStr: -1 });
};

const addHoliday = async (dateStr, name) => {
    return await Holiday.create({ dateStr, name });
};

const deleteHoliday = async (id) => {
    return await Holiday.findByIdAndDelete(id);
};

module.exports = { Holiday, getHolidays, addHoliday, deleteHoliday };
