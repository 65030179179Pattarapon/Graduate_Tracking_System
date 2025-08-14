import express from 'express';
import { createStudent, getAllStudents, getStudentById } from '../controllers/studentsController.js';
import { uploadProfile, uploadSignature } from '../middlewares/uploads.js';
import { uploadProfileImage, uploadSignatureFile } from '../controllers/studentsController.js';

const router = express.Router();

router.post('/', createStudent);
router.get('/', getAllStudents);
router.get('/:student_id', getStudentById);


// Upload รูปโปรไฟล์
router.post('/:student_id/profile-image', uploadProfile.single('profile'), uploadProfileImage);

// Upload ลายเซ็น
router.post('/:student_id/signature', uploadSignature.single('signature'), uploadSignatureFile);

export default router;
