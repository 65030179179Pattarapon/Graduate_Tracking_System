import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

// แปลง __dirname สำหรับ ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// เสิร์ฟไฟล์ static ทั้งหมดจากโฟลเดอร์ client
app.use(express.static(path.join(__dirname, "client")));

// เส้นทาง "/" ให้ไปที่หน้า login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "login", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
