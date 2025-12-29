const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { findUserByMobile, findUserById } = require('../models/userModel');

const login = asyncHandler(async (req, res) => {
    const { mobile, password } = req.body;
    console.log(`[AUTH] Login Attempt: Mobile=${mobile}`);

    const user = await findUserByMobile(mobile);

    // Debugging logs
    if (user) {
        console.log(`[AUTH] User found: ${user._id}`);
        console.log(`[AUTH] User Status: ${user.status}, isDeleted: ${user.isDeleted}`);
        console.log(`[AUTH] Stored Hash starts with: ${user.passwordHash ? user.passwordHash.substring(0, 10) : 'MISSING'}`);
    } else {
        console.log(`[AUTH] User ${mobile} returned NULL from findUserByMobile`);
    }

    // Block if user is deleted or inactive
    if (user && user.isDeleted) {
        console.log(`[AUTH] User ${mobile} is DELETED`);
        res.status(401);
        throw new Error('This account has been deactivated');
    }

    if (user && user.status === 'INACTIVE') {
        console.log(`[AUTH] User ${mobile} is INACTIVE`);
        res.status(401);
        throw new Error('This account is inactive');
    }

    if (!user) {
        console.log(`[AUTH] User ${mobile} NOT FOUND`);
        res.status(401);
        throw new Error('Invalid mobile or password');
    }

    console.log(`[AUTH] User found: ${user._id} (Role: ${user.role})`);
    console.log(`[AUTH] Comparing password...`);
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (isMatch) {
        console.log(`[AUTH] Password Valid. Generating Token...`);
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            user: { id: user._id, name: user.name, role: user.role, mobile: user.mobile },
            token: token
        });
        console.log(`[AUTH] Login Successful for ${mobile}`);
    } else {
        console.log(`[AUTH] Password INVALID for ${mobile}`);
        res.status(401);
        throw new Error('Invalid mobile or password');
    }
});

const getMe = asyncHandler(async (req, res) => {
    const user = await findUserById(req.user.id);
    if (user) {
        res.json({
            id: user.id,
            name: user.name,
            role: user.role,
            mobile: user.mobile
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { login, getMe };