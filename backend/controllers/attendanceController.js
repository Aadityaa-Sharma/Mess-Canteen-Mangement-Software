const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models/userModel');
const { Holiday } = require('../models/holidayModel');
const {
    markAttendance,
    getAttendanceByDate,
    getStudentAttendanceHistory,
    getMissingAttendanceDates
} = require('../models/attendanceModel');

const { getTodayStr } = require('../utils/dateUtils');

// Removed local getTodayString helper in favor of centralized utility

const markBatchAttendance = asyncHandler(async (req, res) => {
    const { date, attendanceData } = req.body;

    if (!Array.isArray(attendanceData)) {
        res.status(400);
        throw new Error('attendanceData must be an array');
    }

    // Use client-provided date string directly (YYYY-MM-DD format)
    // Frontend sends the date exactly as the user selected
    const dateStr = date || getTodayStr();
    console.log(`[ATTENDANCE] Marking for date: ${dateStr}`);

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        res.status(400);
        throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Basic validation: can't be more than 30 days ago
    const today = getTodayStr();
    console.log(`[ATTENDANCE] Today is: ${today}`);

    // STRICT String comparison for date
    if (dateStr > today) {
        console.warn(`[ATTENDANCE] Blocked future date. Request: ${dateStr}, Today: ${today}`);
        res.status(400);
        throw new Error('Cannot mark attendance for future dates');
    }

    try {
        const results = [];
        for (const record of attendanceData) {
            const { studentId, afternoonStatus, nightStatus } = record;
            // Verify student exists and join date? (Optional but safer)
            // For now, trust frontend filter, but log if needed
            const updatedRecord = await markAttendance(studentId, dateStr, afternoonStatus, nightStatus);
            results.push(updatedRecord);
        }
        console.log(`[ATTENDANCE] Successfully marked ${results.length} records for ${dateStr}`);
        res.json({ message: 'Attendance marked', count: results.length, date: dateStr });
    } catch (error) {
        console.error(`[ATTENDANCE] Error marking attendance: ${error.message}`, error);
        res.status(500);
        throw new Error(`Failed to mark attendance: ${error.message}`);
    }
});

const getDailyAttendance = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
        res.status(400);
        throw new Error('Date is required');
    }
    const records = await getAttendanceByDate(date);
    res.json(records);
});

// Get students eligible for attendance on a specific date (joined on or before)
const getStudentsForDate = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
        res.status(400);
        throw new Error('Date is required');
    }

    // Get all active students
    const students = await User.find({
        role: 'STUDENT',
        status: 'ACTIVE',
        isDeleted: false
    }).sort({ name: 1 }).select('name mobile mealSlot joinedAt');

    // Filter by joinedAt - compare as strings
    const filteredStudents = students.filter(student => {
        if (!student.joinedAt) return true;

        // Extract YYYY-MM-DD from joinedAt (handle both Date object and String)
        let joinedStr = student.joinedAt;
        if (student.joinedAt.toISOString) {
            joinedStr = student.joinedAt.toISOString().split('T')[0];
        } else {
            joinedStr = String(student.joinedAt).split('T')[0];
        }

        // Return true if student joined ON OR BEFORE the selected date
        return joinedStr <= date;
    });

    console.log(`[ATTENDANCE] Found ${filteredStudents.length} students eligible for ${date}`);
    res.json(filteredStudents);
});

// Get student attendance history for a month
const getStudentHistory = asyncHandler(async (req, res) => {
    try {
        const { studentId, year, month } = req.query;

        console.log(`[ATTENDANCE-HISTORY] Request for Student: ${studentId}, Year: ${year}, Month: ${month}`);

        if (!studentId || !year || !month) {
            res.status(400);
            throw new Error('studentId, year, and month are required');
        }

        const attendance = await getStudentAttendanceHistory(studentId, parseInt(year), parseInt(month));
        console.log(`[ATTENDANCE-HISTORY] Found ${attendance.length} attendance records`);

        // Get holidays for this month
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const holidays = await Holiday.find({});

        // Filter holidays for this month
        const monthHolidays = holidays.filter(h => {
            const hDateStr = h.date && h.date.toISOString ? h.date.toISOString().split('T')[0] : String(h.date).split('T')[0]; // Safe check
            return hDateStr.startsWith(monthPrefix);
        });
        console.log(`[ATTENDANCE-HISTORY] Found ${monthHolidays.length} holidays for ${monthPrefix}`);

        res.json({
            attendance: attendance.map(a => ({
                date: a.dateStr,
                afternoonStatus: a.afternoonStatus,
                nightStatus: a.nightStatus
            })),
            holidays: monthHolidays.map(h => ({
                date: h.date && h.date.toISOString ? h.date.toISOString().split('T')[0] : String(h.date).split('T')[0],
                name: h.name
            }))
        });
    } catch (error) {
        console.error(`[ATTENDANCE-HISTORY] Error: ${error.message}`, error);
        res.status(500);
        throw new Error(`Failed to history: ${error.message}`);
    }
});

// Get missing attendance dates for current month
const getMissingDates = asyncHandler(async (req, res) => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        console.log(`[ATTENDANCE] Fetching missing dates for ${year}-${month}`);

        const missingDates = await getMissingAttendanceDates(year, month);

        // Get holidays to filter them out
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const holidays = await Holiday.find({});
        const holidayDates = new Set(holidays
            .map(h => h.dateStr || (h.date && h.date.toISOString ? h.date.toISOString().split('T')[0] : String(h.date).split('T')[0]))
            .filter(d => d && d.startsWith(monthPrefix))
        );

        // Filter out holidays from missing dates
        const missingNonHolidays = missingDates.filter(d => !holidayDates.has(d));

        res.json({
            missingDates: missingNonHolidays,
            count: missingNonHolidays.length,
            currentMonth: monthPrefix
        });
    } catch (error) {
        console.error(`[ATTENDANCE] Error getting missing dates: ${error.message}`, error);
        res.status(500);
        throw new Error(`Failed to get missing dates: ${error.message}`);
    }
});

module.exports = {
    markBatchAttendance,
    getDailyAttendance,
    getStudentsForDate,
    getStudentHistory,
    getMissingDates
};