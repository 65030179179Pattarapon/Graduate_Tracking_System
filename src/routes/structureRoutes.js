// src/routes/structureRoutes.js
const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const { protect, checkAdmin } = require('../middleware/authMiddleware');

// --- Department Routes ---
router.get('/departments', protect, checkAdmin, structureController.getAllDepartments);
router.post('/departments', protect, checkAdmin, structureController.createDepartment);
router.put('/departments/:id', protect, checkAdmin, structureController.updateDepartment);
router.delete('/departments/:id', protect, checkAdmin, structureController.deleteDepartment);

router.get('/programs', protect, checkAdmin, structureController.getAllPrograms);
router.post('/programs', protect, checkAdmin, structureController.createProgram);
router.put('/programs/:id', protect, checkAdmin, structureController.updateProgram);
router.delete('/programs/:id', protect, checkAdmin, structureController.deleteProgram);



module.exports = router;