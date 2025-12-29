const express = require('express');
const { validate, schemas } = require('../utils/validation');
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', validate(schemas.login), login);
router.get('/me', protect, getMe);

module.exports = router;