const express = require('express');
const { generateMonthlyBills, getBills, updateBillStatus, downloadBillPDF } = require('../controllers/billController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../utils/validation');
const router = express.Router();

router.post('/generate', protect, ownerOnly, validate(schemas.generateBill), generateMonthlyBills);
router.get('/', protect, getBills);
router.get('/:id/download', protect, downloadBillPDF);
router.put('/:id/pay', protect, ownerOnly, updateBillStatus);

module.exports = router;