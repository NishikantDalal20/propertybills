import express from 'express';
import Property from '../models/Property.js';
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
  await Property.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
  res.json({ message: 'Property deleted' });
});

export default router;