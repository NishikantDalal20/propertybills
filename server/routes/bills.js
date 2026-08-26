import express from 'express';
import Bill from '../models/Bill.js';
import RentalUnit from '../models/RentalUnit.js';
import auth from '../middleware/auth.js';
import { calculateBill } from '../utils/billCalculator.js';

const router = express.Router();

router.post('/generate', auth, async (req, res) => {
  const { unitId, tenantId, month, unitsConsumed, electricityRate, water, maintenance, otherCharges, discount, dueDate } = req.body;

  const existing = await Bill.findOne({ unitId, month });
  if (existing) return res.status(400).json({ message: 'Bill already generated for this unit and month' });

  const unit = await RentalUnit.findById(unitId);
  if (unit.status !== 'Occupied') return res.status(400).json({ message: 'Cannot bill a vacant unit' });

  const { electricity, totalAmount } = calculateBill({
    rent: unit.rentAmount, unitsConsumed, electricityRate, water, maintenance, otherCharges, discount
  });

  const invoiceNumber = `INV-${Date.now()}`;
  const bill = await Bill.create({
    unitId, tenantId, month, invoiceNumber,
    rent: unit.rentAmount, electricity, water, maintenance, otherCharges, discount,
    totalAmount, dueDate, status: 'Pending'
  });
  res.status(201).json(bill);
});

router.get('/', auth, async (req, res) => {
  const bills = await Bill.find().populate('unitId tenantId').sort({ createdAt: -1 });
  res.json(bills);
});

export default router;