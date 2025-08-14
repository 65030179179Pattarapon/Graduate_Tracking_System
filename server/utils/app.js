import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from '../routes/auth';

const app = express();

app.use(bodyParser.json());

// routes
app.use('/api', authRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));
