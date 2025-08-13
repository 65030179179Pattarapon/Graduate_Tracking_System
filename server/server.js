import express from 'express';
import studentsRouter from './routes/students.js';
import advisorsRouter from './routes/advisors.js';
import adminsRoutes from './routes/admin.js';

const app = express();
const port = 5000;

app.use(express.json());

app.use('/api/students', studentsRouter);
app.use('/api/advisors', advisorsRouter);
app.use('/api/admin', adminsRoutes);

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
