import express from 'express';
import RentalUnit from '../models/RentalUnit.js';
import Property from '../models/Property.js';
import Tenant from '../models/Tenant.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper to verify property ownership
async function verifyPropertyOwner(propertyId, userId) {
  if (!propertyId) return false;
  const property = await Property.findOne({ _id: propertyId, ownerId: userId });
  return !!property;
}

// POST /api/units - Create unit
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ message: 'propertyId is required' });
    }

    const isOwner = await verifyPropertyOwner(propertyId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized: Property does not belong to user' });
    }

    const { unitNumber } = req.body;
    if (!unitNumber) {
      return res.status(400).json({ message: 'unitNumber is required' });
    }

    // Check for duplicate unit number under the same property (case-insensitive)
    const normalizedUnitNumber = unitNumber.toString().trim();
    const existingUnit = await RentalUnit.findOne({
      propertyId,
      unitNumber: { $regex: new RegExp(`^${normalizedUnitNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });

    if (existingUnit) {
      return res.status(400).json({ message: 'Unit number already exists for this property' });
    }

    const unit = await RentalUnit.create(req.body);
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/units/vacant - Get all vacant units owned by user
router.get('/vacant', auth, async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user.id });
    const propertyIds = properties.map(p => p._id);
    const units = await RentalUnit.find({
      propertyId: { $in: propertyIds },
      status: 'Vacant'
    }).populate('propertyId');
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/units/property/:propertyId - Get units for property
router.get('/property/:propertyId', auth, async (req, res) => {
  try {
    const isOwner = await verifyPropertyOwner(req.params.propertyId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized: Property does not belong to user' });
    }

    const units = await RentalUnit.find({ propertyId: req.params.propertyId });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/units/:id - Update unit
router.put('/:id', auth, async (req, res) => {
  try {
    const existingUnit = await RentalUnit.findById(req.params.id);
    if (!existingUnit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    // Verify ownership of original unit's property
    const isOwner = await verifyPropertyOwner(existingUnit.propertyId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized: Property does not belong to user' });
    }

    // If propertyId is changing in req.body, verify ownership of new property as well
    if (req.body.propertyId && req.body.propertyId.toString() !== existingUnit.propertyId.toString()) {
      const isNewPropertyOwner = await verifyPropertyOwner(req.body.propertyId, req.user.id);
      if (!isNewPropertyOwner) {
        return res.status(403).json({ message: 'Unauthorized: Target property does not belong to user' });
      }
    }

    const unit = await RentalUnit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/units/:id - Delete unit and unassign tenants
router.delete('/:id', auth, async (req, res) => {
  try {
    const unit = await RentalUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const isOwner = await verifyPropertyOwner(unit.propertyId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized: Property does not belong to user' });
    }

    await Tenant.updateMany({ unitId: req.params.id }, { unitId: null });
    await RentalUnit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Unit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;