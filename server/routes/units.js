import express from 'express';
import RentalUnit from '../models/RentalUnit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const unit = await RentalUnit.create(req.body);
  res.status(201).json(unit);
});

router.get('/property/:propertyId', auth, async (req, res) => {
  const units = await RentalUnit.find({ propertyId: req.params.propertyId });
  res.json(units);
});

router.put('/:id', auth, async (req, res) => {
  const unit = await RentalUnit.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(unit);
});

router.delete('/:id', auth, async (req, res) => {
  await RentalUnit.findByIdAndDelete(req.params.id);
  res.json({ message: 'Unit deleted' });
});

export default router;