// server.js (ฉบับแก้ไขที่ถูกต้อง)

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static Files ---
app.use(express.static('public'));

// --- API Routes ---
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const structureRoutes = require('./src/routes/structureRoutes');

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from Graduate Tracker API!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/structures', structureRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});