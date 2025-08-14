import express from 'express';
import { uploadProfileImage, uploadSignatureFile } from '../controllers/studentsController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// สร้างโฟลเดอร์เก็บไฟล์ถ้าไม่มี
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/profile_images';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/signatures';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const profileUpload = multer({ storage: profileStorage });
const signatureUpload = multer({ storage: signatureStorage });

// Routes
router.post('/profile/:student_id', profileUpload.single('file'), uploadProfileImage);
router.post('/signature/:student_id', signatureUpload.single('file'), uploadSignatureFile);

export default router;
