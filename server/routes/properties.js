import express from 'express';
import Property from '../models/Property.js';
import RentalUnit from '../models/RentalUnit.js';
import Tenant from '../models/Tenant.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const property = await Property.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(property);
});

router.get('/', auth, async (req, res) => {
  const properties = await Property.find({ ownerId: req.user.id });
  res.json(properties);
});

// GET /api/properties/summary - Get summary stats for dashboard
router.get('/summary', auth, async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user.id });
    const propertyIds = properties.map(p => p._id);
    const units = await RentalUnit.find({ propertyId: { $in: propertyIds } });

    const totalProperties = properties.length;
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => u.status === 'Occupied').length;
    const vacantUnits = units.filter(u => u.status === 'Vacant').length;

    res.json({
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const property = await Property.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id }, req.body, { new: true }
  );
  res.json(property);
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const units = await RentalUnit.find({ propertyId: req.params.id });
    const unitIds = units.map(u => u._id);

    await Tenant.updateMany({ unitId: { $in: unitIds } }, { unitId: null });
    await RentalUnit.deleteMany({ propertyId: req.params.id });
    await Property.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });

    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;