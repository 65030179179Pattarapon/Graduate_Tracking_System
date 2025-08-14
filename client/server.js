import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// เสิร์ฟไฟล์ static ทั้งหมดใน client
app.use(express.static(path.join(__dirname))); // server ทุกไฟล์ใน client

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login', 'index.html'));
});

// เริ่มรันพอร์ต 3000
app.listen(PORT, () => {
  console.log(`Frontend is running at http://localhost:${PORT}`);
});
