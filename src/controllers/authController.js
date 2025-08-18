// src/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // ตรวจสอบว่ามี email และ password ส่งมาหรือไม่
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอก Email และรหัสผ่าน' });
  }

  try {
    // ค้นหา user จาก email ในฐานข้อมูล
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีนี้ในระบบ' });
    }

    // เปรียบเทียบรหัสผ่านที่ส่งมากับ hash ในฐานข้อมูล
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ถ้าถูกต้อง สร้าง JWT Token
    const payload = {
      userId: user.user_id,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, // เราจะไปสร้างตัวแปรนี้ใน .env กัน
      { expiresIn: '1d' } // Token มีอายุ 1 วัน
    );

    // ส่ง Token กลับไปให้ Frontend
    res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token: token,
      role: user.role
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};