import express from 'express';
import cors from 'cors';
import studentsRouter from './routes/students.js';
import advisorsRouter from './routes/advisors.js';
import adminsRoutes from './routes/admin.js';
import { login } from './controllers/loginController.js';
import uploadRouter from './routes/upload.js';
import db from './db.js'; // อย่าลืม import db ด้วยถ้าใช้ query

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

// Login API
app.post('/api/login', login); // ใช้ controller เดียว

// Routes
app.use('/api/students', studentsRouter);
app.use('/api/advisors', advisorsRouter);
app.use('/api/admin', adminsRoutes);
app.use('/api/upload', uploadRouter);

// Profile API
app.get('/api/profile/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM students WHERE student_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
