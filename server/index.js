import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import unitRoutes from './routes/units.js';
import tenantRoutes from './routes/tenants.js';
import readingRoutes from './routes/readings.js';
import billRoutes from './routes/bills.js';
import paymentRoutes from './routes/payments.js';
import invoiceRoutes from './routes/invoices.js';
import statsRoutes from './routes/stats.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import { startDueDateReminderJob } from './jobs/dueDateReminderJob.js';

const app = express();

// Configure CORS for production & development
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Health check endpoint for Render monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start due-date reminder background scheduler
startDueDateReminderJob();

// Authentication routes
app.use('/api/auth', authRoutes);

app.use('/api/properties', propertyRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);


if (!process.env.MONGO_URI) {
  console.error('CRITICAL: MONGO_URI environment variable is missing in process.env. Please configure it in your Render Environment settings.');
} else {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));
}

app.get('/', (req, res) => res.send('PropertyBills API running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));