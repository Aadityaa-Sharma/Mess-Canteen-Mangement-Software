const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose'); // Changed: Import mongoose
const { connectDB } = require('./config/db'); // Changed: Import connectDB

// Route Imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const billRoutes = require('./routes/billRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const staffRoutes = require('./routes/staffRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const sideIncomeRoutes = require('./routes/sideIncomeRoutes');

const app = express();

// Check for critical environment variables
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}
if (!process.env.DATABASE_URL) {
    console.error('FATAL ERROR: DATABASE_URL is not defined in environment variables.');
}

// Connect Database
connectDB();

// 1. Advanced CORS (Dynamic Origin for Production)
const whitelist = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Relaxed local development
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // Check against whitelist or allow Vercel previews dynamically
        if (whitelist.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin); // Log the blocked origin for debugging
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// 2. Security Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// 3. Health Check
app.get('/health', (req, res) => { // Changed: Mongoose State Check
    const state = mongoose.connection.readyState;
    if (state === 1) {
        res.status(200).send('OK');
    } else {
        res.status(503).send('Database Disconnected');
    }
});

// ... Routes ...
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/side-income', sideIncomeRoutes);

// Error Handler (MUST be last)
const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

// 4. Graceful Shutdown
// Only start HTTP server when running locally (not on Vercel)
// On Vercel, the app is exported as a serverless function via api/index.js
if (require.main === module && !process.env.VERCEL) {
    const server = app.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });

    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            mongoose.connection.close(false, () => { // Changed: Mongoose close
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    });
}

module.exports = app;