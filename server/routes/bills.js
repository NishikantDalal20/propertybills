import express from 'express';
import mongoose from 'mongoose';
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

// Overdue detection: Finds bills where dueDate < now && status !== 'Paid', sets status to 'Overdue'
router.get('/overdue', auth, async (req, res) => {
  try {
    const now = new Date();

    // Set status to 'Overdue' for any unpaid bills past their due date
    await Bill.updateMany(
      { dueDate: { $lt: now }, status: { $ne: 'Paid' } },
      { status: 'Overdue' }
    );

    const overdueBills = await Bill.find({ status: 'Overdue' })
      .populate('unitId tenantId')
      .sort({ dueDate: 1 });

    res.json({
      message: 'Overdue status check completed',
      count: overdueBills.length,
      bills: overdueBills
    });
  } catch (err) {
    console.error('Error updating overdue bills:', err);
    res.status(500).json({ message: 'Server error while checking overdue bills' });
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

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Paid', 'Partial', 'Overdue'].includes(status)) {
      return res.status(400).json({ message: 'Invalid bill status' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bill ID' });
    }
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('unitId tenantId');

    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    console.error('Error updating bill status:', err);
    res.status(500).json({ message: 'Server error while updating bill status' });
  }
});

// Download Invoice Endpoint
router.get('/:id/download', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid bill ID format' });
    }

    const bill = await Bill.findById(req.params.id).populate('unitId tenantId');
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const tenantName = bill.tenantId?.name || 'Valued Tenant';
    const unitLabel = bill.unitId?.unitNumber ? `Unit ${bill.unitId.unitNumber}` : 'Rental Unit';
    const invNumber = bill.invoiceNumber || `INV-${bill._id}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; background: #fff; }
    .invoice-card { max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
    .subbrand { font-size: 12px; color: #6b7280; font-weight: 500; margin-top: 2px; }
    .inv-title { text-align: right; }
    .inv-no { font-size: 18px; font-weight: 700; color: #111827; margin-top: 4px; font-family: monospace; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .info-grid { display: flex; justify-content: space-between; background: #f9fafb; padding: 16px; border-radius: 8px; font-size: 13px; margin-bottom: 24px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    .table th { background: #f3f4f6; text-align: left; padding: 10px 12px; color: #4b5563; font-weight: 600; text-transform: uppercase; font-size: 11px; }
    .table td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
    .table td.amount { text-align: right; font-weight: 600; }
    .total-box { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 14px; font-weight: 700; }
    .total-amount { font-size: 22px; color: #111827; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">PROPERTYBILLS</div>
        <div class="subbrand">Property Management Invoice</div>
      </div>
      <div class="inv-title">
        <span class="status-badge ${bill.status === 'Paid' ? 'status-paid' : 'status-pending'}">${bill.status || 'Pending'}</span>
        <div class="inv-no">${invNumber}</div>
      </div>
    </div>
    
    <div class="info-grid">
      <div>
        <strong style="color: #6b7280; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">Billed To</strong>
        <div style="font-weight: 700; font-size: 14px;">${tenantName}</div>
        <div>${unitLabel}</div>
      </div>
      <div style="text-align: right;">
        <div><strong>Billing Month:</strong> ${bill.month}</div>
        <div><strong>Issue Date:</strong> ${new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Base Rent</td><td class="amount">₹${(bill.rent || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Electricity Charges</td><td class="amount">₹${(bill.electricity || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Water Utility</td><td class="amount">₹${(bill.water || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td>Maintenance Fee</td><td class="amount">₹${(bill.maintenance || 0).toLocaleString('en-IN')}</td></tr>
        ${(bill.otherCharges || 0) > 0 ? `<tr><td>Other Charges</td><td class="amount">₹${bill.otherCharges.toLocaleString('en-IN')}</td></tr>` : ''}
        ${(bill.discount || 0) > 0 ? `<tr><td style="color: #059669; font-weight: 600;">Discount Applied</td><td class="amount" style="color: #059669;">-₹${bill.discount.toLocaleString('en-IN')}</td></tr>` : ''}
      </tbody>
    </table>

    <div class="total-box">
      <span>Total Amount Due</span>
      <span class="total-amount">₹${(bill.totalAmount || 0).toLocaleString('en-IN')}</span>
    </div>

    <div class="footer">
      Thank you for your payment. Generated by PropertyBills System.
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invNumber}.html"`);
    return res.send(htmlContent);
  } catch (err) {
    console.error('Error generating invoice download:', err);
    res.status(500).json({ message: 'Server error while downloading invoice' });
  }
});

export default router;