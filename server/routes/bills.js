import express from 'express';
import Bill from '../models/Bill.js';
import RentalUnit from '../models/RentalUnit.js';
import Tenant from '../models/Tenant.js';
import auth from '../middleware/auth.js';
import { calculateBill } from '../utils/billCalculator.js';

const router = express.Router();

router.post('/generate', auth, async (req, res) => {
  try {
    const {
      unitId,
      tenantId,
      month,
      unitsConsumed = 0,
      electricityRate = 0,
      water = 0,
      maintenance = 0,
      otherCharges = 0,
      discount = 0,
      dueDate
    } = req.body;

    if (!unitId || !month) {
      return res.status(400).json({ message: 'Unit ID and Month are required' });
    }

    const existing = await Bill.findOne({ unitId, month });
    if (existing) {
      return res.status(400).json({ message: 'Bill already generated for this unit and month' });
    }

    const unit = await RentalUnit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Rental unit not found' });
    }

    if (unit.status !== 'Occupied') {
      return res.status(400).json({ message: 'Cannot generate bill for a vacant unit' });
    }

    // Auto-resolve active tenant for this unit if tenantId not explicitly provided
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const activeTenant = await Tenant.findOne({ unitId, status: 'Active' });
      finalTenantId = activeTenant ? activeTenant._id : null;
    }

    const rentAmount = Number(unit.rentAmount) || 0;
    const consumed = Number(unitsConsumed) || 0;
    const rate = Number(electricityRate) || 0;
    const waterFee = Number(water) || 0;
    const maintFee = Number(maintenance) || 0;
    const extraFee = Number(otherCharges) || 0;
    const disc = Number(discount) || 0;

    const { electricity, totalAmount } = calculateBill({
      rent: rentAmount,
      unitsConsumed: consumed,
      electricityRate: rate,
      water: waterFee,
      maintenance: maintFee,
      otherCharges: extraFee,
      discount: disc
    });

    const invoiceNumber = `INV-${Date.now()}`;
    const bill = await Bill.create({
      unitId,
      tenantId: finalTenantId,
      month,
      invoiceNumber,
      rent: rentAmount,
      electricity,
      water: waterFee,
      maintenance: maintFee,
      otherCharges: extraFee,
      discount: disc,
      totalAmount,
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'Pending'
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error('Error generating bill:', err);
    res.status(500).json({ message: err.message || 'Server error while generating bill' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const bills = await Bill.find().populate('unitId tenantId').sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ message: 'Server error while fetching bills' });
  }
});

router.get('/unit/:unitId', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ unitId: req.params.unitId })
      .populate('unitId')
      .populate('tenantId')
      .sort({ month: -1 });

    res.json(bills);
  } catch (err) {
    console.error('Error fetching unit bill history:', err);
    res.status(500).json({
      message: 'Server error while fetching unit bill history'
    });
  }
});

export default router;