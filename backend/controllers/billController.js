const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models/userModel');
const { Bill } = require('../models/billModel');
const { Holiday } = require('../models/holidayModel');
const { Attendance } = require('../models/attendanceModel');
const { AuditLog } = require('../models/auditLogModel');

// Free holidays per meal slot type
const FREE_HOLIDAYS = {
    'BOTH': 2,      // Both meals - 2 free holidays
    'NIGHT': 2,     // Night only - 2 free holidays
    'AFTERNOON': 0  // Afternoon only - 0 free holidays
};

const { getTodayStr, getISTDate } = require('../utils/dateUtils');

// Helper to round to even number
const roundToEven = (num) => Math.round(num / 2) * 2;

const generateMonthlyBills = asyncHandler(async (req, res) => {
    const { month, year } = req.body;

    try {
        const monthMap = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        const monthNum = monthMap[month];

        if (!monthNum) {
            res.status(400);
            throw new Error('Invalid month name');
        }

        const requestedYear = parseInt(year);
        const now = getISTDate();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // Validation: not future month
        if (requestedYear > currentYear || (requestedYear === currentYear && monthNum > currentMonth)) {
            res.status(400);
            throw new Error(`Cannot generate bills for future months.`);
        }

        const totalDaysInMonth = new Date(requestedYear, monthNum, 0).getDate();
        const monthPrefix = `${requestedYear}-${String(monthNum).padStart(2, '0')}`;

        // Get holidays for this month (using dateStr field)
        const holidays = await Holiday.find({
            dateStr: { $regex: `^${monthPrefix}` }
        });
        const holidayCount = holidays.length;
        const holidayDates = new Set(holidays.map(h => h.dateStr));

        // 1. Fetch eligible students (sorted by name)
        const students = await User.find({ role: 'STUDENT', status: 'ACTIVE', isDeleted: false }).sort({ name: 1 });

        // 2. Get existing bills for this month to preserve PAID status
        const existingBills = await Bill.find({ month, year: requestedYear });
        const paidStudentIds = new Set(
            existingBills.filter(b => b.status === 'PAID').map(b => b.studentId.toString())
        );

        // 3. Delete ONLY pending bills
        await Bill.deleteMany({ month, year: requestedYear, status: { $ne: 'PAID' } });

        let newBillsCount = 0;
        let skippedPaidCount = 0;

        const billPromises = students.map(async (student) => {
            // Skip if student already has a PAID bill
            if (paidStudentIds.has(student.id)) {
                skippedPaidCount++;
                return;
            }

            // Get student's joined date (stored as YYYY-MM-DD string or Date object)
            let joinedAt = student.joinedAt || '2020-01-01';
            if (typeof joinedAt === 'object' && joinedAt.toISOString) {
                joinedAt = joinedAt.toISOString().split('T')[0];
            } else if (joinedAt.includes('T')) {
                joinedAt = joinedAt.split('T')[0];
            }

            // Skip if student joined AFTER the billing month ended
            const monthEndStr = `${requestedYear}-${String(monthNum).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;
            if (joinedAt > monthEndStr) {
                return;
            }

            // Get student's meal slot and base fee
            const mealSlot = student.mealSlot || 'BOTH';
            const mealsPerDay = student.mealsPerDay || (mealSlot === 'BOTH' ? 2 : 1);
            const monthlyFee = student.monthlyFee || (mealSlot === 'BOTH' ? 2700 : 1400);
            const freeHolidays = FREE_HOLIDAYS[mealSlot] || 0;

            // Calculate effective start date for billing
            const monthStartStr = `${requestedYear}-${String(monthNum).padStart(2, '0')}-01`;
            let effectiveStartStr = monthStartStr;
            let effectiveStartDay = 1;

            if (joinedAt > monthStartStr && joinedAt <= monthEndStr) {
                effectiveStartStr = joinedAt;
                effectiveStartDay = parseInt(joinedAt.split('-')[2]);
            }

            const daysEnrolled = totalDaysInMonth - effectiveStartDay + 1;

            // Get attendance records for this student in this month (using dateStr)
            const attendanceRecords = await Attendance.find({
                studentId: student._id,
                dateStr: { $regex: `^${monthPrefix}` }
            });

            // Filter to only dates >= effectiveStartStr
            const validAttendance = attendanceRecords.filter(r => r.dateStr >= effectiveStartStr);

            // Count actual meals eaten and track absent dates with shift info
            let mealsPresent = 0;
            let mealsAbsent = 0;
            const absentMap = new Map(); // Track absences by date

            validAttendance.forEach(record => {
                const isHoliday = holidayDates.has(record.dateStr);

                if (!isHoliday) {
                    let afternoonAbsent = false;
                    let nightAbsent = false;

                    if (mealSlot === 'AFTERNOON' || mealSlot === 'BOTH') {
                        if (record.afternoonStatus === 'PRESENT') mealsPresent++;
                        else if (record.afternoonStatus === 'ABSENT') {
                            mealsAbsent++;
                            afternoonAbsent = true;
                        }
                    }
                    if (mealSlot === 'NIGHT' || mealSlot === 'BOTH') {
                        if (record.nightStatus === 'PRESENT') mealsPresent++;
                        else if (record.nightStatus === 'ABSENT') {
                            mealsAbsent++;
                            nightAbsent = true;
                        }
                    }

                    // Determine shift label for this date
                    if (afternoonAbsent || nightAbsent) {
                        let shift;
                        if (afternoonAbsent && nightAbsent) {
                            shift = 'Both';
                        } else if (afternoonAbsent) {
                            shift = 'Afternoon';
                        } else {
                            shift = 'Night';
                        }
                        absentMap.set(record.dateStr, shift);
                    }
                }
            });

            // Convert map to sorted array
            const absentDates = Array.from(absentMap.entries())
                .map(([date, shift]) => ({ date, shift }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Calculate per-meal rate
            // User Request: subtract free holidays (e.g. 2) from total multiplier to get divisor
            // e.g. 62 meals - 2 meals = 60 divisor. 2700 / 60 = 45.
            const totalMeals = totalDaysInMonth * mealsPerDay;
            // Treat freeHolidays as 'meals' to be subtracted based on user's specific math request (62-2=60)
            // If mealSlot is BOTH (2 meals/day) and freeHolidays is 2 (from map), we subtract 2.
            const divisor = Math.max(1, totalMeals - freeHolidays);
            const perMealRate = monthlyFee / divisor;

            // Holiday deduction calculation (for rebate)
            // If divisor is reduced, perMealRate is higher.
            const excessHolidays = Math.max(0, holidayCount - freeHolidays);
            const holidayMealsDeducted = excessHolidays * mealsPerDay;

            // Calculate final amount based on actual meals present
            let finalAmount;
            let billMethod;

            if (validAttendance.length > 0) {
                // Attendance-based billing: charge only for meals marked PRESENT
                finalAmount = roundToEven(mealsPresent * perMealRate);
                billMethod = 'attendance';
            } else {
                // No attendance marked yet - fall back to pro-rated monthly fee
                const proRatedFee = (monthlyFee * daysEnrolled) / totalDaysInMonth;
                const holidayDeduction = holidayMealsDeducted * perMealRate;
                finalAmount = roundToEven(Math.max(0, proRatedFee - holidayDeduction));
                billMethod = 'prorated';
            }

            const breakdown = {
                bill_method: billMethod,
                monthly_fee: monthlyFee,
                meal_slot: mealSlot,
                meals_per_day: mealsPerDay,
                days_in_month: totalDaysInMonth,
                days_enrolled: daysEnrolled,
                joined_at: joinedAt,
                per_meal_rate: Math.round(perMealRate * 100) / 100,
                meals_present: mealsPresent,
                meals_absent: mealsAbsent,
                absent_dates: absentDates,
                attendance_days: validAttendance.length,
                holidays_in_month: holidayCount,
                free_holidays: freeHolidays,
                excess_holidays: excessHolidays
            };

            newBillsCount++;
            await Bill.create({
                studentId: student._id,
                month,
                year: requestedYear,
                baseAmount: monthlyFee,
                rebateAmount: 0,
                finalAmount,
                breakdown,
                status: 'PENDING'
            });
        });

        await Promise.all(billPromises);

        // Audit Log
        await AuditLog.create({
            userId: req.user?.id,
            action: 'GENERATED_BILLS',
            tableName: 'bills',
            recordId: '0',
            newValues: {
                month,
                year: requestedYear,
                newBills: newBillsCount,
                skippedPaid: skippedPaidCount,
                holidaysInMonth: holidayCount
            }
        });

        res.status(201).json({
            message: `Generated ${newBillsCount} bills. Skipped ${skippedPaidCount} already paid. ${holidayCount} holidays in ${month}.`,
            newBills: newBillsCount,
            skippedPaid: skippedPaidCount,
            holidaysInMonth: holidayCount
        });

    } catch (error) {
        console.error("Billing Failed:", error);
        res.status(500);
        throw new Error('Billing Failed: ' + error.message);
    }
});

const getBills = asyncHandler(async (req, res) => {
    const { studentId, status, month, year } = req.query;
    const mongoose = require('mongoose');

    let query = {};

    // Authorization check
    if (req.user.role === 'STUDENT') {
        query.studentId = new mongoose.Types.ObjectId(req.user.id);
    } else if (studentId) {
        query.studentId = new mongoose.Types.ObjectId(studentId);
    }

    if (status) query.status = status;
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    // Aggregation with user lookup and sorting by student name
    const pipeline = [
        { $match: query },
        {
            $lookup: {
                from: 'users',
                localField: 'studentId',
                foreignField: '_id',
                as: 'student'
            }
        },
        { $unwind: '$student' },
        {
            $match: {
                'student.role': 'STUDENT',
                'student.isDeleted': false
            }
        },
        { $sort: { 'student.name': 1, generatedAt: -1 } },
        {
            $project: {
                _id: 0,
                id: { $toString: '$_id' },
                month: 1,
                year: 1,
                baseAmount: 1,
                rebateAmount: 1,
                finalAmount: 1,
                amount: '$finalAmount',
                status: 1,
                breakdown: 1,
                generatedAt: 1,
                paymentReference: 1,
                paidAt: 1,
                student_id: '$studentId',
                student_name: '$student.name',
                mobile: '$student.mobile',
                meal_slot: '$student.mealSlot'
            }
        }
    ];

    const result = await Bill.aggregate(pipeline);
    res.json(result);
});

const updateBillStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { transactionRef } = req.body;

    const bill = await Bill.findByIdAndUpdate(
        id,
        {
            status: 'PAID',
            paymentReference: transactionRef,
            paidAt: new Date()
        },
        { new: true }
    );

    if (!bill) {
        res.status(404);
        throw new Error('Bill not found');
    }

    res.json(bill);
});

// PDF Bill Download
const PDFDocument = require('pdfkit');

const downloadBillPDF = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bill = await Bill.findById(id).populate('studentId');

    if (!bill) {
        res.status(404);
        throw new Error('Bill not found');
    }

    if (req.user.role === 'STUDENT' && bill.studentId._id.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to download this bill');
    }

    const student = bill.studentId;
    const breakdown = bill.breakdown || {};

    // --- Data Preparation ---
    const invoiceNo = `INV-${bill.year}-${bill.month.toUpperCase().slice(0, 3)}-${student.mobile.slice(-4)}`;
    const billDate = new Date(bill.generatedAt || Date.now()).toLocaleDateString('en-IN');

    const upiId = "prafullharer@slc";
    const payeeName = "Prafull Harer";
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${bill.finalAmount}&cu=INR&tn=Mess-Bill-${bill.month}-${bill.year}`;

    // --- PDF Setup ---
    const doc = new PDFDocument({ margin: 50, size: 'A4' }); // Reverted to standard margin for safer content area

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bill_${bill.month}_${bill.year}_${student.name.replace(/\s+/g, '_')}.pdf`);

    doc.pipe(res);

    // --- Colors ---
    const colors = {
        primary: '#1F2937',  // Slate 800
        accent: '#3B82F6',   // Blue 500
        success: '#10B981',  // Green 500
        warning: '#F59E0B',  // Amber 500
        lightGray: '#F9FAFB', // Slate 50
        border: '#E5E7EB',   // Gray 200
        textDark: '#111827',
        textLight: '#6B7280'
    };

    // --- Helper Functions ---
    let y = 0; // Current Y pointer (relative to margins not needed if we use doc.y, but custom tracking is safer for absolute rects)

    // Header Background (Absolute)
    doc.rect(0, 0, 595, 130).fill(colors.primary);

    // Header Text
    doc.fillColor('#FFFFFF');
    doc.fontSize(28).font('Helvetica-Bold').text('MESS INVOICE', 50, 45);

    doc.fontSize(10).font('Helvetica').fillColor('#E5E7EB');
    doc.text('Mess & Canteen Management System', 50, 80);
    doc.text('Email: support@messmanagement.com', 50, 95);
    doc.text('Contact: 7387533549', 50, 110);

    // Invoice Meta (Top Right)
    doc.fontSize(10).fillColor('#FFFFFF');
    const metaX = 400;
    let metaY = 45;

    const drawMetaRow = (label, value) => {
        doc.font('Helvetica').text(label, metaX, metaY, { width: 80, align: 'right' });
        doc.font('Helvetica-Bold').text(value, metaX + 90, metaY, { width: 100, align: 'right' }); // Increased width for long Invoice Nos
        metaY += 20; // Increased spacing from 15 to 20 to prevent overlap
    };

    drawMetaRow('Invoice No:', invoiceNo);
    drawMetaRow('Date:', billDate);
    drawMetaRow('Month:', `${bill.month} ${bill.year}`);
    drawMetaRow('Status:', bill.status);

    // --- Content Start ---
    y = 170;
    doc.fillColor(colors.textDark);

    // Student Details
    doc.fontSize(14).font('Helvetica-Bold').text('BILLED TO:', 50, y);
    y += 25;

    doc.fontSize(12).font('Helvetica').text(student.name, 50, y);
    y += 20;

    doc.fontSize(10).fillColor(colors.textLight);
    doc.text(`Mobile: ${student.mobile}`, 50, y);
    y += 15;
    doc.text(`Meal Slot: ${breakdown.meal_slot || student.mealSlot || 'BOTH'}`, 50, y);
    y += 15;
    doc.text(`Joined: ${breakdown.joined_at || student.joinedAt || 'N/A'}`, 50, y);
    y += 25; // Space before meal counts

    // Meal Counts (Explicit highlight)
    doc.fillColor(colors.textDark).font('Helvetica-Bold');
    doc.text(`Meals Present: ${breakdown.meals_present || 0}`, 50, y);
    y += 15;
    doc.text(`Meals Absent: ${breakdown.meals_absent || 0}`, 50, y);

    // Summary Box (Right Side) - Box Y matches Student Info Y roughly
    const summaryBoxY = 170;
    doc.roundedRect(350, summaryBoxY, 200, 100, 8).fill(colors.lightGray); // Shaded box

    doc.fillColor(colors.textDark).fontSize(10).font('Helvetica-Bold')
        .text('SUMMARY', 370, summaryBoxY + 15);

    doc.font('Helvetica').fontSize(12)
        .text('Total Amount Due', 370, summaryBoxY + 40);

    doc.fontSize(24).font('Helvetica-Bold')
        .fillColor(bill.status === 'PAID' ? colors.success : colors.primary)
        .text(`₹${bill.finalAmount}`, 370, summaryBoxY + 60);

    // --- Table Section ---
    y = Math.max(y + 40, 310); // Ensure table starts clear of student info

    const tableHeaders = ['DESCRIPTION', 'DETAILS', 'AMOUNT'];
    const colWidths = [240, 150, 100];
    const colX = [50, 300, 450];

    // Header Helper
    const drawTableHeader = (currY) => {
        doc.rect(40, currY, 515, 30).fill(colors.lightGray); // Header bg
        doc.fillColor(colors.textDark).fontSize(10).font('Helvetica-Bold');
        tableHeaders.forEach((h, i) => {
            doc.text(h, colX[i], currY + 10, {
                width: colWidths[i],
                align: i === 2 ? 'right' : 'left'
            });
        });
        return currY + 40;
    };

    y = drawTableHeader(y);

    // Row Helper
    const drawRow = (desc, detail, amount, isTotal = false) => {
        // Page Break Check
        if (y > 700) {
            doc.addPage();
            y = 50;
            y = drawTableHeader(y);
        }

        doc.fillColor(isTotal ? colors.textDark : '#4B5563');
        if (isTotal) doc.font('Helvetica-Bold'); else doc.font('Helvetica');

        doc.text(desc, colX[0], y, { width: colWidths[0] });
        doc.text(detail, colX[1], y, { width: colWidths[1] });
        doc.text(amount, colX[2], y, { width: colWidths[2], align: 'right' });

        // Line
        y += 20;
        doc.strokeColor(colors.border).moveTo(40, y).lineTo(555, y).stroke();
        y += 15; // Padding for next row
    };

    // --- Generate Rows ---
    const perMealRate = breakdown.per_meal_rate || 0;
    const monthlyFee = breakdown.monthly_fee || 0;
    const mealsPresent = breakdown.meals_present || 0;
    const mealsAbsent = breakdown.meals_absent || 0;

    if (breakdown.bill_method === 'attendance') {
        drawRow('Mess Fee', `Attendance Based (${mealsPresent} * ₹${perMealRate})`, `₹${bill.finalAmount}`);
    } else {
        drawRow('Monthly Base Fee', 'Standard Rate', `₹${monthlyFee}`);
        drawRow('Meals Present', `${mealsPresent} Days`, '-');
        drawRow('Meals Absent', `${mealsAbsent} Days`, '-');

        const holidayDeduction = monthlyFee - bill.finalAmount;
        if (holidayDeduction > 0) {
            drawRow('Rebate / Adjustment', 'Absence Deduction', `- ₹${Math.round(holidayDeduction)}`);
        }
    }

    // --- Total Row ---
    y += 10;
    // Highlight Total Row
    drawRow('TOTAL', '', `₹${bill.finalAmount}`, true);


    // --- Absent Dates (if any) ---
    const absentDates = breakdown.absent_dates || [];
    if (absentDates.length > 0) {
        y += 20;
        if (y > 650) { doc.addPage(); y = 50; }

        doc.fillColor(colors.textDark).fontSize(12).font('Helvetica-Bold')
            .text(`Absent Dates (${absentDates.length})`, 50, y);
        y += 20;

        doc.fontSize(9).font('Helvetica').fillColor(colors.textLight);
        let dateText = '';
        absentDates.forEach((rec, i) => {
            const d = typeof rec === 'string' ? rec : rec.date;
            const s = typeof rec === 'string' ? '' : (rec.shift === 'Both' ? '(All)' : `(${rec.shift})`);
            dateText += `${d} ${s}   |   `;
            if ((i + 1) % 4 === 0) dateText += '\n';
        });

        doc.text(dateText, 50, y, { width: 500 });
        y += doc.heightOfString(dateText, { width: 500 }) + 30;
    } else {
        y += 30; // Just some spacing
    }


    // --- Footer Section (Payment Info) ---
    // Ensure footer doesn't get cut off
    if (y > 650) {
        doc.addPage();
        y = 50;
    }

    const footerY = y;

    if (bill.status === 'PAID') {
        // PAID Watermark
        doc.save();
        doc.rotate(-15, { origin: [300, 400] });
        doc.opacity(0.1);
        doc.fontSize(120).fillColor(colors.success).text('PAID', 150, 400, { align: 'center' });
        doc.restore();

        // Payment Info Box
        doc.rect(50, footerY, 495, 60).fill('#ECFDF5');
        doc.fillColor('#065F46').fontSize(12).font('Helvetica-Bold')
            .text('PAYMENT RECEIVED', 70, footerY + 15);
        doc.fontSize(10).font('Helvetica')
            .text(`Date: ${new Date(bill.paidAt || Date.now()).toLocaleDateString('en-IN')}`, 70, footerY + 35)
            .text(`Ref: ${bill.paymentReference || 'N/A'}`, 300, footerY + 35);

    } else {
        // UPI Payment Box
        doc.rect(50, footerY, 495, 90).fill('#EFF6FF');
        doc.fillColor('#1E40AF').fontSize(12).font('Helvetica-Bold')
            .text('PAYMENT OPTIONS', 70, footerY + 15);

        doc.fontSize(10).font('Helvetica').fillColor('#1E3A8A')
            .text(`UPI ID: ${upiId}`, 70, footerY + 35)
            .text(`Payee: ${payeeName}`, 300, footerY + 35);

        doc.fillColor(colors.accent)
            .text('Click here to Pay Now', 70, footerY + 55, { link: upiLink, underline: true });

        doc.fontSize(8).fillColor(colors.textLight)
            .text('Please verify the payee name "Prafull Harer" before proceeding.', 70, footerY + 75);
    }

    doc.end();
});

module.exports = { generateMonthlyBills, getBills, updateBillStatus, downloadBillPDF };