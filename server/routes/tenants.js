import express from 'express';
import Tenant from '../models/Tenant.js';
import RentalUnit from '../models/RentalUnit.js';
import Property from '../models/Property.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const tenant = await Tenant.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(tenant);
});

router.get('/', auth, async (req, res) => {
  const tenants = await Tenant.find({ ownerId: req.user.id }).populate({
    path: 'unitId',
    populate: { path: 'propertyId' }
  });
  res.json(tenants);
});

router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { unitId } = req.body;
    if (!unitId) {
      return res.status(400).json({ message: 'unitId is required' });
    }

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Verify tenant ownership
    if (tenant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate tenant status
    if (tenant.status !== 'Active') {
      return res.status(400).json({ message: 'Tenant must be Active to be assigned' });
    }

    // Validate tenant not already assigned
    if (tenant.unitId) {
      return res.status(400).json({ message: 'Tenant is already assigned to a unit' });
    }

    const unit = await RentalUnit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Rental unit not found' });
    }

    // Verify unit ownership (via property)
    const property = await Property.findOne({ _id: unit.propertyId, ownerId: req.user.id });
    if (!property) {
      return res.status(403).json({ message: 'Unauthorized: Target unit property does not belong to user' });
    }

    // Validate unit status
    if (unit.status === 'Occupied') {
      return res.status(400).json({ message: 'Unit already occupied' });
    }

    // Update assignment
    tenant.unitId = unitId;
    await tenant.save();

    unit.status = 'Occupied';
    await unit.save();

    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  await Tenant.findByIdAndDelete(req.params.id);
  res.json({ message: 'Tenant deleted' });
});

export default router;