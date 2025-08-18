// src/controllers/adminController.js (ฉบับสมบูรณ์)
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- ดึงข้อมูล Dashboard ---
exports.getDashboardSummary = async (req, res) => {
    try {
        const [pendingResult, approvedResult, rejectedResult, studentResult] = await Promise.all([
            db.query("SELECT COUNT(*) FROM documents WHERE status = 'รอตรวจ'"),
            db.query("SELECT COUNT(*) FROM documents WHERE status = 'อนุมัติแล้ว'"),
            db.query("SELECT COUNT(*) FROM documents WHERE status = 'ส่งกลับให้แก้ไข'"),
            db.query("SELECT COUNT(*) FROM students")
        ]);
        res.status(200).json({
            success: true,
            data: {
                pendingCount: parseInt(pendingResult.rows[0].count),
                approvedCount: parseInt(approvedResult.rows[0].count),
                rejectedCount: parseInt(rejectedResult.rows[0].count),
                studentCount: parseInt(studentResult.rows[0].count),
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

//--- ดึงรายชื่อนักศึกษาทั้งหมด ---
exports.getAllStudents = async (req, res) => {
    try {
        const query = `
            SELECT s.student_id, s.prefix_th, s.first_name_th, s.last_name_th, 
                   s.phone, u.email, p.name as program_name
            FROM students s
            LEFT JOIN programs p ON s.program_id = p.program_id
            LEFT JOIN users u ON s.user_id = u.user_id
            ORDER BY s.student_id ASC;
        `;
        const { rows } = await db.query(query);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching all students:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

// --- ดึงข้อมูลนักศึกษา 1 คน (ฉบับยกเครื่อง) ---
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. ดึงข้อมูลหลักของนักศึกษา
        const studentQuery = `
            SELECT s.*, u.email, p.name as program_name
            FROM students s
            LEFT JOIN users u ON s.user_id = u.user_id
            LEFT JOIN programs p ON s.program_id = p.program_id
            WHERE s.student_id = $1;
        `;
        const studentResult = await db.query(studentQuery, [id]);

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
        }
        
        const studentData = studentResult.rows[0];

        // 2. ดึงข้อมูลอาจารย์ที่ปรึกษาของนักศึกษาคนนี้จากตารางใหม่
        const advisorQuery = `
            SELECT sa.role, a.advisor_id, a.prefix_th, a.first_name_th, a.last_name_th
            FROM student_advisors sa
            JOIN advisors a ON sa.advisor_id = a.advisor_id
            WHERE sa.student_id = $1;
        `;
        const advisorResult = await db.query(advisorQuery, [id]);
        
        studentData.advisors = advisorResult.rows; // เพิ่มข้อมูลอาจารย์เข้าไปใน object

        res.status(200).json({ success: true, data: studentData });
    } catch (error) {
        console.error(`Error fetching student by ID: ${req.params.id}`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

// --- อัปเดตข้อมูลนักศึกษา (ฉบับยกเครื่อง) ---
exports.updateStudent = async (req, res) => {
    const studentId = req.params.id;
    // Separate advisors from the main student data
    const { advisors, ...studentFields } = req.body; 

    // 🔽 Add this line to remove the email field 🔽
    delete studentFields.email;

    if (studentFields.degree) {
        studentFields.degree = studentFields.degree === 'ป.โท' ? 'ปริญญาโท' : 'ปริญญาเอก';
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // This part of the code is now safe because 'email' has been removed
        const fieldEntries = Object.entries(studentFields);
        if (fieldEntries.length > 0) {
            const setClause = fieldEntries.map(([key, value], i) => `"${key}" = $${i + 1}`).join(', ');
            const values = fieldEntries.map(([key, value]) => value);
            const updateStudentQuery = `UPDATE students SET ${setClause} WHERE student_id = $${values.length + 1}`;
            await client.query(updateStudentQuery, [...values, studentId]);
        }

        // ... (The rest of the function for updating advisors remains the same) ...

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'อัปเดตข้อมูลนักศึกษาสำเร็จ' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating student: ${studentId}`, error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    } finally {
        client.release();
    }
};

// --- สร้างนักศึกษาใหม่ (ฉบับยกเครื่อง) ---
exports.createStudent = async (req, res) => {
    const { advisors, ...studentFields } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. สร้าง User
        const tempPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(tempPassword, salt);
        const userQuery = `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING user_id;`;
        const userResult = await client.query(userQuery, [studentFields.email, password_hash]);
        const newUserId = userResult.rows[0].user_id;

        studentFields.user_id = newUserId;

        // 2. สร้าง Student
        const studentColumns = ['student_id', 'user_id', 'prefix_th', 'first_name_th', 'last_name_th', 'prefix_en', 'first_name_en', 'last_name_en', 'phone', 'admit_year', 'admit_semester', 'status', 'plan', 'gender'];
        const studentValues = studentColumns.map(col => studentFields[col] || null);
        const valuePlaceholders = studentColumns.map((col, i) => `$${i + 1}`).join(', ');
        const studentQuery = `INSERT INTO students (${studentColumns.join(', ')}) VALUES (${valuePlaceholders}) RETURNING student_id;`;
        await client.query(studentQuery, studentValues);

        // 3. เพิ่ม Advisors (ถ้ามี)
        if (advisors && advisors.length > 0) {
            const advisorInsertQuery = 'INSERT INTO student_advisors (student_id, advisor_id, role) VALUES ($1, $2, $3)';
            for (const advisor of advisors) {
                await client.query(advisorInsertQuery, [studentFields.student_id, advisor.advisor_id, advisor.role]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'เพิ่มข้อมูลนักศึกษาสำเร็จ' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating student:', error);
        res.status(500).json({ success: false, message: `เกิดข้อผิดพลาด: ${error.message}` });
    } finally {
        client.release();
    }
};

exports.getAllProgramsForSelect = async (req, res) => {
    try {
        // ดึงข้อมูลหลักสูตรทั้งหมด โดยอาจจะกรองตามระดับปริญญา (degree) ที่ส่งมา
        const { degree } = req.query; // รับค่า degree จาก query parameter
        let query = 'SELECT program_id, name FROM programs';
        const queryParams = [];

        if (degree) {
            // แปลงค่าจาก "ป.โท" -> "ปริญญาโท"
            const fullDegreeName = degree === 'ป.โท' ? 'ปริญญาโท' : 'ปริญญาเอก';
            query += ' WHERE degree_level = $1'; // แก้ไขชื่อคอลัมน์ให้ถูกต้อง
            queryParams.push(fullDegreeName);
        }

        query += ' ORDER BY name;';

        const { rows } = await db.query(query, queryParams);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching all programs for select:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหลักสูตร' });
    }
};

exports.getAllPrograms = async (req, res) => {
    try {
        const query = 'SELECT program_id, name, degree_level, department_id FROM programs ORDER BY program_id';
        const { rows } = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};