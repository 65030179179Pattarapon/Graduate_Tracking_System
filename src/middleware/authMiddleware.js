// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้อง, การเข้าถึงถูกปฏิเสธ' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'ไม่มี Token, การเข้าถึงถูกปฏิเสธ' });
    }
};

exports.checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลส่วนนี้' });
    }
};