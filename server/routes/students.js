import express from 'express';
import { createStudent, getAllStudents, getStudentById } from '../controllers/studentsController.js';

const router = express.Router();

router.post('/', createStudent);
router.get('/', getAllStudents);
router.get('/:student_id', getStudentById);

export default router;
