// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// เมื่อมี Request แบบ POST มาที่ /api/auth/login
router.post('/login', authController.login);

module.exports = router;