import express from 'express';
import MeterReading from '../models/MeterReading.js';
import RentalUnit from '../models/RentalUnit.js';
import Property from '../models/Property.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper to verify property/unit ownership
async function verifyUnitOwner(unitId, userId) {
  if (!unitId) return false;
  const unit = await RentalUnit.findById(unitId);
  if (!unit) return false;
  const property = await Property.findOne({ _id: unit.propertyId, ownerId: userId });
  return !!property;
}

// POST /api/readings - Create meter reading
router.post('/', auth, async (req, res) => {
  try {
    const { unitId, month, previousReading, currentReading } = req.body;
    
    if (!unitId || !month || previousReading === undefined || currentReading === undefined) {
      return res.status(400).json({ message: 'All fields (unitId, month, previousReading, currentReading) are required' });
    }

    const isOwner = await verifyUnitOwner(unitId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized: Unit does not belong to user properties' });
    }

    const prevNum = Number(previousReading);
    const currNum = Number(currentReading);

    if (isNaN(prevNum) || isNaN(currNum)) {
      return res.status(400).json({ message: 'Readings must be valid numbers' });
    }

    if (currNum < prevNum) {
      return res.status(400).json({ message: 'Current reading cannot be less than previous reading' });
    }

    // Check for existing reading for this unit and month
    const existingReading = await MeterReading.findOne({ unitId, month });
    if (existingReading) {
      return res.status(400).json({ message: `A meter reading for month ${month} already exists for this unit` });
    }

    const reading = await MeterReading.create({
      unitId,
      month,
      previousReading: prevNum,
      currentReading: currNum
    });

    res.status(201).json(reading);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/readings/unit/:unitId - Get meter readings for a unit
router.get('/unit/:unitId', auth, async (req, res) => {
  try {
    const isOwner = await verifyUnitOwner(req.params.unitId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized: Unit does not belong to user properties' });
    }

    const readings = await MeterReading.find({ unitId: req.params.unitId }).sort({ month: -1 });
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;