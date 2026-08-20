import express from 'express';
import Tenant from '../models/Tenant.js';
import RentalUnit from '../models/RentalUnit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const tenant = await Tenant.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(tenant);
});

router.get('/', auth, async (req, res) => {
  const tenants = await Tenant.find({ ownerId: req.user.id }).populate('unitId');
  res.json(tenants);
});

router.put('/:id/assign', auth, async (req, res) => {
  const { unitId } = req.body;
  const unit = await RentalUnit.findById(unitId);
  if (unit.status === 'Occupied') return res.status(400).json({ message: 'Unit already occupied' });

  const tenant = await Tenant.findByIdAndUpdate(req.params.id, { unitId }, { new: true });
  unit.status = 'Occupied';
  await unit.save();
  res.json(tenant);
});

router.delete('/:id', auth, async (req, res) => {
  await Tenant.findByIdAndDelete(req.params.id);
  res.json({ message: 'Tenant deleted' });
});

export default router;