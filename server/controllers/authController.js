import pool from '../db/pool.js';
import { comparePassword } from '../utils/password.js';

export async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอก email และ password' });
    }

    try {
        const result = await pool.query(
            'SELECT email, password_hash, role, prefix_th, first_name_th, last_name_th FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ message: 'ไม่พบบัญชีนี้ในระบบ' });
        }

        const user = result.rows[0];
        const match = await comparePassword(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        const fullname = `${user.prefix_th || ''}${user.first_name_th || ''} ${user.last_name_th || ''}`.trim();

        return res.json({
            email: user.email,
            role: user.role,
            fullname
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
    }
}
