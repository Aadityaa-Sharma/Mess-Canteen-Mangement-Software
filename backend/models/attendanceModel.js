const mongoose = require('mongoose');
const { getTodayStr } = require('../utils/dateUtils');

const attendanceSchema = mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Store date as simple YYYY-MM-DD string to avoid ALL timezone issues
    dateStr: { type: String, required: true },
    // 2-shift attendance: each can be PRESENT, ABSENT, or null (not applicable)
    afternoonStatus: { type: String, enum: ['PRESENT', 'ABSENT', null], default: null },
    nightStatus: { type: String, enum: ['PRESENT', 'ABSENT', null], default: null }
}, {
    timestamps: false
});

// Index for fast lookup by student and date string
attendanceSchema.index({ studentId: 1, dateStr: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

const markAttendance = async (studentId, dateStr, afternoonStatus, nightStatus) => {
    const updateData = {};
    if (afternoonStatus !== undefined) updateData.afternoonStatus = afternoonStatus;
    if (nightStatus !== undefined) updateData.nightStatus = nightStatus;

    return await Attendance.findOneAndUpdate(
        { studentId, dateStr },
        { ...updateData, dateStr },
        { upsert: true, new: true }
    );
};

const getAttendanceByDate = async (dateStr) => {
    return await Attendance.find({ dateStr }).populate('studentId', 'name mobile mealSlot');
};

const getStudentAttendanceHistory = async (studentId, year, month) => {
    // Match all dates in that month: YYYY-MM-*
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    return await Attendance.find({
        studentId,
        dateStr: { $regex: `^${monthPrefix}` }
    }).sort({ dateStr: 1 });
};

const getMonthlyAttendanceCount = async (studentId, monthNum, year, slot = 'BOTH') => {
    const monthPrefix = `${year}-${String(monthNum).padStart(2, '0')}`;

    const records = await Attendance.find({
        studentId,
        dateStr: { $regex: `^${monthPrefix}` }
    });

    let presentCount = 0;
    records.forEach(record => {
        if (slot === 'AFTERNOON' || slot === 'BOTH') {
            if (record.afternoonStatus === 'PRESENT') presentCount++;
        }
        if (slot === 'NIGHT' || slot === 'BOTH') {
            if (record.nightStatus === 'PRESENT') presentCount++;
        }
    });

    return presentCount;
};



// Get dates in current month where attendance is not marked
const getMissingAttendanceDates = async (year, month) => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    // Get all dates that have attendance records
    const markedRecords = await Attendance.find({
        dateStr: { $regex: `^${monthPrefix}` }
    }).select('dateStr');

    const markedDates = new Set(markedRecords.map(r => r.dateStr));

    // Generate all dates in range up to today
    const todayStr = getTodayStr();
    const daysInMonth = new Date(year, month, 0).getDate();

    const missingDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dateStr > todayStr) break; // Don't include future dates
        if (!markedDates.has(dateStr)) {
            missingDates.push(dateStr);
        }
    }

    return missingDates;
};

module.exports = {
    Attendance,
    markAttendance,
    getAttendanceByDate,
    getMonthlyAttendanceCount,
    getStudentAttendanceHistory,
    getMissingAttendanceDates
};