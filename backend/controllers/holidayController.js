const asyncHandler = require('../utils/asyncHandler');
const { Holiday, getHolidays, addHoliday, deleteHoliday } = require('../models/holidayModel');

// Get all holidays
const getHolidaysController = asyncHandler(async (req, res) => {
    const { year, month } = req.query;

    const holidays = await getHolidays(year, month);

    res.json(holidays.map(h => ({
        id: h._id.toString(),
        date: h.dateStr,
        name: h.name,
        created_at: h.created_at
    })));
});

// Add a holiday
const addHolidayController = asyncHandler(async (req, res) => {
    const { date, name } = req.body;

    if (!date || !name) {
        res.status(400);
        throw new Error('Date and name are required');
    }

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400);
        throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Check if holiday exists for this date
    const existing = await Holiday.findOne({ dateStr: date });
    if (existing) {
        res.status(400);
        throw new Error('Holiday already exists for this date');
    }

    const holiday = await addHoliday(date, name);

    res.status(201).json({
        id: holiday._id.toString(),
        date: holiday.dateStr,
        name: holiday.name,
        created_at: holiday.created_at
    });
});

// Delete a holiday
const deleteHolidayController = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const holiday = await deleteHoliday(id);

    if (!holiday) {
        res.status(404);
        throw new Error('Holiday not found');
    }

    res.json({ message: 'Holiday deleted' });
});

module.exports = {
    getHolidays: getHolidaysController,
    addHoliday: addHolidayController,
    deleteHoliday: deleteHolidayController
};
