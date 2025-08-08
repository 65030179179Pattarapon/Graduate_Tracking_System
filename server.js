const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// บอกว่าโฟลเดอร์เหล่านี้ให้เสิร์ฟไฟล์ static ได้
app.use(express.static(path.join(__dirname, 'Admin_Page')));
app.use(express.static(path.join(__dirname, 'User_Page')));
app.use(express.static(path.join(__dirname, 'login')));
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'data')));

// ตั้งค่าหน้าแรก เช่น login/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
