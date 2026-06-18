import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import jobRoutes from './routes/jobRoutes';
import workerRoutes from './routes/workerRoutes';
import employerRoutes from './routes/employerRoutes';
import applicationRoutes from './routes/applicationRoutes';
import reviewRoutes from './routes/reviewRoutes';
import supportRoutes from './routes/supportRoutes';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/worklink';

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WorkLink API is running' });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
