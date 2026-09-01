import express from 'express';
import Payment from '../models/Payment.js';
import Bill from '../models/Bill.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { billId, amountPaid, method, transactionRef } = req.body;
  const bill = await Bill.findById(billId);
  const payments = await Payment.find({ billId });
  const totalPaidSoFar = payments.reduce((sum, p) => sum + p.amountPaid, 0) + amountPaid;

  const payment = await Payment.create({ billId, amountPaid, method, transactionRef });

  bill.status = totalPaidSoFar >= bill.totalAmount ? 'Paid' : 'Partial';
  await bill.save();

  res.status(201).json({ payment, billStatus: bill.status, remaining: Math.max(bill.totalAmount - totalPaidSoFar, 0) });
});

router.get('/bill/:billId', auth, async (req, res) => {
  const payments = await Payment.find({ billId: req.params.billId }).sort({ paymentDate: -1 });
  res.json(payments);
});

export default router;