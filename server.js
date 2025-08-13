import express from 'express';
import studentsRouter from './routes/students.js';
import advisorsRouter from './routes/advisors.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api/students', studentsRouter);
app.use('/api/advisors', advisorsRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
