import express from 'express';
import MeterReading from '../models/MeterReading.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { unitId, month, previousReading, currentReading } = req.body;
  if (currentReading < previousReading) {
    return res.status(400).json({ message: 'Current reading cannot be less than previous reading' });
  }
  const reading = await MeterReading.create({ unitId, month, previousReading, currentReading });
  res.status(201).json(reading);
});

router.get('/unit/:unitId', auth, async (req, res) => {
  const readings = await MeterReading.find({ unitId: req.params.unitId }).sort({ month: -1 });
  res.json(readings);
});

export default router;