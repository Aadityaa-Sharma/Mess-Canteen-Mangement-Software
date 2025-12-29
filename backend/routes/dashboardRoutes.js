const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, ownerOnly, getDashboardStats);

module.exports = router;
