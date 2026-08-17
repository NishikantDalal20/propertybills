import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import unitRoutes from './routes/units.js';

const app = express();
app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);

app.use('/api/properties', propertyRoutes);
app.use('/api/units', unitRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => res.send('PropertyBills API running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));