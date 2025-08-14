import pool from '../db.js';

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'กรุณากรอก email และ password' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password, role FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'ไม่พบบัญชีนี้ในระบบ' });
    }

    const user = result.rows[0];

    // ตรวจสอบ password แบบ plain text
    if (password !== user.password) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
}