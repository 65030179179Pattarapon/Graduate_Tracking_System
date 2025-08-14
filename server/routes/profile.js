// server/routes/profile.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // 1. ดึงข้อมูลนักศึกษา + program + department
        const studentResult = await pool.query(`
            SELECT s.*, p.name AS program_name, d.name AS department_name
            FROM students s
            LEFT JOIN programs p ON s.program_id = p.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE s.email = $1
        `, [email]);

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลนักศึกษา' });
        }

        const student = studentResult.rows[0];

        // 2. ดึงข้อมูล advisors
        const advisorsResult = await pool.query('SELECT * FROM advisors');
        const advisors = advisorsResult.rows;

        // 3. ดึงเอกสารที่อนุมัติจาก document_approved
        const docsResult = await pool.query(`
            SELECT * FROM document_approved WHERE student_id = $1 OR student_email = $2
        `, [student.student_id, email]);
        const approvedDocs = docsResult.rows;

        return res.json({
            student,
            advisors,
            approvedDocs
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
});

export default router;
