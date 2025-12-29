const express = require('express');
const { getStudents, addStudent, editStudent, removeStudent } = require('../controllers/studentController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../utils/validation');
const router = express.Router();

router.get('/', protect, ownerOnly, getStudents);
router.post('/', protect, ownerOnly, validate(schemas.studentAdd), addStudent);
router.put('/:id', protect, ownerOnly, validate(schemas.studentEdit), editStudent);
router.delete('/:id', protect, ownerOnly, removeStudent);

module.exports = router;