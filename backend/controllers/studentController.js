const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { getAllStudents, createUser, updateUser, deleteUser, findUserByMobile, findUserById } = require('../models/userModel');

// Simplified meal plan rates based on slot
const MEAL_RATES = {
    'BOTH': 2700,      // 2 meals/day (Afternoon + Night) - 2 free holidays
    'NIGHT': 1400,     // 1 meal/day (Night only) - 2 free holidays
    'AFTERNOON': 1400  // 1 meal/day (Afternoon only) - 0 free holidays
};

// Free holidays per slot type
const FREE_HOLIDAYS = {
    'BOTH': 2,
    'NIGHT': 2,
    'AFTERNOON': 0
};

const getStudents = asyncHandler(async (req, res) => {
    const students = await getAllStudents(); // Already sorted by name
    res.json(students);
});

const addStudent = asyncHandler(async (req, res) => {
    console.log('[STUDENT] Add Student Request Body:', JSON.stringify(req.body, null, 2));
    const {
        name, mobile, password,
        meal_slot, joined_at
    } = req.body;

    console.log('[STUDENT] Parsed fields - name:', name, 'mobile:', mobile, 'meal_slot:', meal_slot, 'joined_at:', joined_at);

    // Validate mandatory fields
    if (!name || !name.trim()) {
        res.status(400);
        throw new Error('Student name is required');
    }
    if (!mobile || mobile.length !== 10) {
        res.status(400);
        throw new Error('Valid 10-digit mobile number is required');
    }
    if (!password) {
        res.status(400);
        throw new Error('Password is required');
    }
    if (!joined_at) {
        res.status(400);
        throw new Error('Join date is required');
    }
    if (!meal_slot || !['AFTERNOON', 'NIGHT', 'BOTH'].includes(meal_slot)) {
        res.status(400);
        throw new Error('Valid meal slot (AFTERNOON, NIGHT, or BOTH) is required');
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(joined_at)) {
        res.status(400);
        throw new Error('Join date must be in YYYY-MM-DD format');
    }

    if (await findUserByMobile(mobile)) {
        console.warn(`[STUDENT] Duplicate mobile: ${mobile}`);
        res.status(400);
        throw new Error('Student with this mobile already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Calculate fee based on meal_slot
    const monthlyFee = MEAL_RATES[meal_slot];
    const mealsPerDay = meal_slot === 'BOTH' ? 2 : 1;

    const student = await createUser({
        name: name.trim(),
        mobile,
        passwordHash: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
        monthlyFee,
        paymentMode: 'PREPAID',
        dailyRate: Math.round(monthlyFee / 30),
        messType: meal_slot === 'BOTH' ? 'FULL' : 'SINGLE',
        mealSlot: meal_slot,
        joinedAt: joined_at,  // Store as YYYY-MM-DD string directly
        mealsPerDay,
        advanceBalance: 0
    });

    console.log(`[STUDENT] Created student: ${student.id} (Slot: ${meal_slot}, Fee: ₹${monthlyFee}, Joined: ${joined_at})`);
    res.status(201).json(student);
});

const editStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        name, mobile, status,
        meal_slot, joined_at, password
    } = req.body;

    const existingUser = await findUserById(id);
    if (!existingUser) {
        res.status(404);
        throw new Error('Student not found');
    }

    // Calculate fee based on meal_slot if changed
    const slot = meal_slot || existingUser.mealSlot || 'BOTH';
    const monthlyFee = MEAL_RATES[slot];
    const mealsPerDay = slot === 'BOTH' ? 2 : 1;

    // Use new joined_at or keep existing (already stored as string)
    const joinDate = joined_at || existingUser.joinedAt;

    // Handle password update if provided
    let updateData = {
        name: name?.trim(),
        mobile,
        status,
        monthlyFee,
        messType: slot === 'BOTH' ? 'FULL' : 'SINGLE',
        mealSlot: slot,
        joinedAt: joinDate,
        mealsPerDay,
        dailyRate: Math.round(monthlyFee / 30)
    };

    if (password && password.trim()) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updated = await updateUser(id, updateData);
    res.json(updated);
});

const removeStudent = asyncHandler(async (req, res) => {
    await deleteUser(req.params.id);
    res.json({ message: 'Student removed' });
});

module.exports = { getStudents, addStudent, editStudent, removeStudent, FREE_HOLIDAYS, MEAL_RATES };