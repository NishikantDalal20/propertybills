import express from 'express';
import Payment from '../models/Payment.js';
import Bill from '../models/Bill.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Record a new payment for a bill
router.post('/', auth, async (req, res) => {
  try {
    const { billId, amountPaid, method, transactionRef } = req.body;

    if (!billId || amountPaid === undefined || amountPaid === null) {
      return res.status(400).json({ message: 'Bill ID and Amount Paid are required' });
    }

    const numAmount = Number(amountPaid);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount paid must be a positive number' });
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      billId,
      amountPaid: numAmount,
      method: method || 'Cash',
      transactionRef: transactionRef || '',
      paymentDate: new Date()
    });

    // Calculate total payments recorded for this bill
    const allPayments = await Payment.find({ billId });
    const totalPaidSoFar = allPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // Update bill status automatically based on total paid vs bill totalAmount
    let newStatus = bill.status;
    if (totalPaidSoFar >= bill.totalAmount) {
      newStatus = 'Paid';
    } else if (totalPaidSoFar > 0) {
      newStatus = 'Partial';
    }

    if (newStatus !== bill.status) {
      bill.status = newStatus;
      await bill.save();
    }

    const updatedBill = await Bill.findById(billId).populate('unitId tenantId');

    res.status(201).json({
      payment,
      bill: updatedBill,
      totalPaidSoFar,
      remainingBalance: Math.max(0, bill.totalAmount - totalPaidSoFar)
    });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ message: err.message || 'Server error while recording payment' });
  }
});

// Fetch payment history for a bill
router.get('/bill/:billId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ billId: req.params.billId }).sort({ createdAt: -1 });
    const totalPaidSoFar = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    
    res.json({
      payments,
      totalPaidSoFar
    });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

export default router;
