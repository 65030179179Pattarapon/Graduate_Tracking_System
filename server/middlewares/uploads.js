import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ฟังก์ชันสร้าง multer storage สำหรับแต่ละประเภทไฟล์
function createUploadMiddleware(folder) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `./uploads/${folder}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${req.params.student_id}_${Date.now()}${ext}`;
      cb(null, uniqueName);
    }
  });
  return multer({ storage });
}

// export สำหรับใช้ใน routes
export const uploadProfile = createUploadMiddleware('profile_images');
export const uploadSignature = createUploadMiddleware('signatures');
export const uploadDocument = createUploadMiddleware('documents');
