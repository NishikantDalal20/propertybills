import express from 'express';
import mongoose from 'mongoose';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Bill from '../models/Bill.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/:billId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.billId)) {
      return res.status(400).json({ message: 'Invalid bill ID format' });
    }

    const bill = await Bill.findById(req.params.billId).populate('unitId tenantId');
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const invNum = bill.invoiceNumber || bill._id;
    const tenantName = bill.tenantId?.name || '';
    const rent = bill.rent || 0;
    const electricity = bill.electricity || 0;
    const water = bill.water || 0;
    const total = bill.totalAmount || 0;

    page.drawText(`Invoice #${invNum}`, { x: 50, y: 550, size: 18, font });
    page.drawText(`Month: ${bill.month || ''}`, { x: 50, y: 520, size: 12, font });
    page.drawText(`Tenant: ${tenantName}`, { x: 50, y: 500, size: 12, font });
    page.drawText(`Rent: Rs. ${rent}`, { x: 50, y: 470, size: 12, font });
    page.drawText(`Electricity: Rs. ${electricity}`, { x: 50, y: 450, size: 12, font });
    page.drawText(`Water: Rs. ${water}`, { x: 50, y: 430, size: 12, font });
    page.drawText(`Total: Rs. ${total}`, { x: 50, y: 400, size: 16, font, color: rgb(0, 0, 0.7) });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invNum}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating PDF invoice:', err);
    res.status(500).json({ message: 'Server error while generating invoice PDF' });
  }
});

export default router;
