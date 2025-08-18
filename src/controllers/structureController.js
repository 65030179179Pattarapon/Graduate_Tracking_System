// src/controllers/structureController.js
const db = require('../config/db');

// ดึงข้อมูลภาควิชาทั้งหมด
exports.getAllDepartments = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM departments ORDER BY department_id ASC');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// สร้างภาควิชาใหม่
exports.createDepartment = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อภาควิชา' });
    }
    try {
        const query = 'INSERT INTO departments (name) VALUES ($1) RETURNING *';
        const { rows } = await db.query(query, [name]);
        res.status(201).json({ success: true, message: 'เพิ่มภาควิชาสำเร็จ', data: rows[0] });
    } catch (error) {
        console.error("Error creating department:", error);
        // --- เพิ่มการดักจับ Error ข้อมูลซ้ำ ---
        if (error.code === '23505') { // 23505 คือรหัส Error ของ Unique Violation ใน PostgreSQL
            return res.status(409).json({ success: false, message: 'ไม่สามารถเพิ่มข้อมูลได้: มีชื่อภาควิชานี้อยู่แล้ว' });
        }
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
    }
};

// ดึงข้อมูลหลักสูตรทั้งหมดพร้อมชื่อภาควิชา
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

// สร้างหลักสูตรใหม่
exports.createProgram = async (req, res) => {
    const { name, degree_level, department_id } = req.body;
    if (!name || !degree_level || !department_id) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    try {
        const query = `
            INSERT INTO programs (name, degree_level, department_id) 
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const { rows } = await db.query(query, [name, degree_level, department_id]);
        res.status(201).json({ success: true, message: 'เพิ่มหลักสูตรสำเร็จ', data: rows[0] });
    } catch (error) {
        console.error("Error creating program:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// แก้ไขข้อมูลหลักสูตร
exports.updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, degree_level, department_id } = req.body;
        if (!name || !degree_level || !department_id) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        const query = `
            UPDATE programs 
            SET name = $1, degree_level = $2, department_id = $3 
            WHERE program_id = $4 RETURNING *`;
        const { rows } = await db.query(query, [name, degree_level, department_id, id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตรที่ต้องการแก้ไข' });
        }
        res.status(200).json({ success: true, message: 'แก้ไขข้อมูลสำเร็จ', data: rows[0] });
    } catch (error) {
        console.error("Error updating program:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ลบหลักสูตร
exports.deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM programs WHERE program_id = $1 RETURNING *';
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบหลักสูตรที่ต้องการลบ' });
        }
        res.status(200).json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
    } catch (error) {
        console.error("Error deleting program:", error);
        if (error.code === '23503') { // Foreign Key Violation
            return res.status(409).json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากมีนักศึกษาอยู่ในหลักสูตรนี้' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อภาควิชา' });
        }
        const query = 'UPDATE departments SET name = $1 WHERE department_id = $2 RETURNING *';
        const { rows } = await db.query(query, [name, id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบภาควิชาที่ต้องการแก้ไข' });
        }
        res.status(200).json({ success: true, message: 'แก้ไขข้อมูลสำเร็จ', data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'ไม่สามารถแก้ไขได้: มีชื่อภาควิชานี้อยู่แล้ว' });
        }
        console.error("Error updating department:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- ฟังก์ชันสำหรับลบภาควิชา (เพิ่มเข้ามาใหม่) ---
exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM departments WHERE department_id = $1 RETURNING *';
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบภาควิชาที่ต้องการลบ' });
        }
        res.status(200).json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
    } catch (error) {
        console.error("Error deleting department:", error);
        // ดักจับ Error กรณีที่มีหลักสูตรผูกอยู่
        if (error.code === '23503') { // Foreign Key Violation
            return res.status(409).json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากมีหลักสูตรผูกอยู่กับภาควิชานี้' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};