// src/routes/adminRoutes.js (ฉบับสมบูรณ์)
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, checkAdmin } = require('../middleware/authMiddleware');

// --- Dashboard ---
router.get('/dashboard-summary', protect, checkAdmin, adminController.getDashboardSummary);

// --- Students ---
router.get('/students', protect, checkAdmin, adminController.getAllStudents);
router.post('/students', protect, checkAdmin, adminController.createStudent);
router.get('/students/:id', protect, checkAdmin, adminController.getStudentById);
router.put('/students/:id', protect, checkAdmin, adminController.updateStudent);

router.get('/programs-list', adminController.getAllProgramsForSelect);

module.exports = router;