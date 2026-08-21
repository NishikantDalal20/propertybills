import express from 'express';
import Tenant from '../models/Tenant.js';
import RentalUnit from '../models/RentalUnit.js';
import Property from '../models/Property.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const tenant = await Tenant.create({ ...req.body, ownerId: req.user.id });
    res.status(201).json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const tenants = await Tenant.find({ ownerId: req.user.id }).populate({
      path: 'unitId',
      populate: { path: 'propertyId' }
    });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      const existingAssignedUnit = await RentalUnit.findById(tenant.unitId);
      if (existingAssignedUnit) {
        return res.status(400).json({ message: 'Tenant is already assigned to a unit' });
      } else {
        // Clean up stale unit reference if unit was deleted
        tenant.unitId = null;
      }
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

// PUT /api/tenants/:id/unassign - Unassign tenant from unit
router.put('/:id/unassign', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!tenant.unitId) {
      return res.status(400).json({ message: 'Tenant is not assigned to any unit' });
    }

    const unit = await RentalUnit.findById(tenant.unitId);
    if (unit) {
      unit.status = 'Vacant';
      await unit.save();
    }

    tenant.unitId = null;
    await tenant.save();

    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tenants/:id/status - Toggle or update tenant status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const newStatus = req.body.status || (tenant.status === 'Active' ? 'Inactive' : 'Active');
    if (!['Active', 'Inactive'].includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    tenant.status = newStatus;
    await tenant.save();

    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tenants/:id - General update endpoint for tenant
router.put('/:id', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.body.status && ['Active', 'Inactive'].includes(req.body.status)) {
      tenant.status = req.body.status;
    }
    if (req.body.name) tenant.name = req.body.name;
    if (req.body.phone !== undefined) tenant.phone = req.body.phone;
    if (req.body.email !== undefined) tenant.email = req.body.email;

    await tenant.save();
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (tenant.unitId) {
      const unit = await RentalUnit.findById(tenant.unitId);
      if (unit) {
        unit.status = 'Vacant';
        await unit.save();
      }
    }

    await Tenant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tenant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;