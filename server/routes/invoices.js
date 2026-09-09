import express from 'express';
import mongoose from 'mongoose';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper to format date cleanly
const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    return new Date(dateInput).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

// GET /api/invoices/:billId - PDF Invoice Generation
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
    const page = pdfDoc.addPage([550, 750]);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const primaryColor = rgb(0.12, 0.16, 0.24); // Dark Navy
    const accentBlue = rgb(0.15, 0.38, 0.92);   // SaaS Blue
    const grayText = rgb(0.4, 0.45, 0.52);
    const darkText = rgb(0.1, 0.12, 0.15);
    const lightBg = rgb(0.96, 0.97, 0.98);
    const borderColor = rgb(0.88, 0.9, 0.93);
    const emeraldColor = rgb(0.02, 0.6, 0.42);

    const invNum = bill.invoiceNumber || bill._id;
    const tenantName = bill.tenantId?.name || 'Valued Tenant';
    const unitLabel = bill.unitId?.unitNumber ? `Unit ${bill.unitId.unitNumber}` : 'Rental Unit';
    const rent = Number(bill.rent || 0);
    const electricity = Number(bill.electricity || 0);
    const water = Number(bill.water || 0);
    const maintenance = Number(bill.maintenance || 0);
    const otherCharges = Number(bill.otherCharges || 0);
    const discount = Number(bill.discount || 0);
    const totalAmount = bill.totalAmount !== undefined ? Number(bill.totalAmount) : (rent + electricity + water + maintenance + otherCharges - discount);

    // Outer Container Border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: 490,
      height: 690,
      borderColor,
      borderWidth: 1,
      color: rgb(1, 1, 1)
    });

    // Brand Header Box
    page.drawRectangle({
      x: 30,
      y: 650,
      width: 490,
      height: 70,
      color: lightBg
    });

    page.drawText('PROPERTYBILLS', {
      x: 50,
      y: 692,
      size: 18,
      font: fontBold,
      color: primaryColor
    });

    page.drawText('Property Management Invoice', {
      x: 50,
      y: 672,
      size: 10,
      font: fontRegular,
      color: grayText
    });

    page.drawText('RENTAL INVOICE', {
      x: 370,
      y: 692,
      size: 12,
      font: fontBold,
      color: accentBlue
    });

    page.drawText(`#${invNum}`, {
      x: 370,
      y: 672,
      size: 11,
      font: fontRegular,
      color: darkText
    });

    // Divider
    page.drawLine({
      start: { x: 30, y: 650 },
      end: { x: 520, y: 650 },
      thickness: 1,
      color: borderColor
    });

    // Meta Section Box (Billed To & Invoice Details)
    page.drawRectangle({
      x: 50,
      y: 540,
      width: 450,
      height: 90,
      color: lightBg,
      borderColor,
      borderWidth: 1
    });

    // Billed To Column
    page.drawText('BILLED TO', { x: 65, y: 610, size: 9, font: fontBold, color: grayText });
    page.drawText(tenantName, { x: 65, y: 590, size: 12, font: fontBold, color: darkText });
    page.drawText(unitLabel, { x: 65, y: 572, size: 10, font: fontRegular, color: grayText });

    // Invoice Meta Column
    page.drawText('INVOICE DETAILS', { x: 300, y: 610, size: 9, font: fontBold, color: grayText });
    page.drawText(`Billing Month: ${bill.month || 'N/A'}`, { x: 300, y: 590, size: 10, font: fontRegular, color: darkText });
    page.drawText(`Issue Date: ${formatDate(bill.createdAt)}`, { x: 300, y: 574, size: 10, font: fontRegular, color: darkText });
    page.drawText(`Status: ${bill.status || 'Pending'}`, { x: 300, y: 558, size: 10, font: fontBold, color: bill.status === 'Paid' ? emeraldColor : accentBlue });

    // Table Header
    page.drawRectangle({
      x: 50,
      y: 495,
      width: 450,
      height: 25,
      color: primaryColor
    });

    page.drawText('DESCRIPTION', { x: 65, y: 503, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('AMOUNT', { x: 420, y: 503, size: 10, font: fontBold, color: rgb(1, 1, 1) });

    // Table Rows
    const items = [
      { label: 'Base Rent', amount: rent },
      { label: 'Electricity Charges', amount: electricity },
      { label: 'Water Utility', amount: water },
      { label: 'Maintenance Fee', amount: maintenance }
    ];

    if (otherCharges > 0) items.push({ label: 'Other Charges', amount: otherCharges });
    if (discount > 0) items.push({ label: 'Discount Applied', amount: -discount, isDiscount: true });

    let currentY = 470;
    items.forEach((item) => {
      page.drawLine({
        start: { x: 50, y: currentY - 8 },
        end: { x: 500, y: currentY - 8 },
        thickness: 0.5,
        color: borderColor
      });

      const labelColor = item.isDiscount ? emeraldColor : darkText;
      const amtText = item.isDiscount ? `-Rs. ${Math.abs(item.amount).toLocaleString('en-IN')}` : `Rs. ${item.amount.toLocaleString('en-IN')}`;

      page.drawText(item.label, { x: 65, y: currentY, size: 10, font: item.isDiscount ? fontBold : fontRegular, color: labelColor });
      page.drawText(amtText, { x: 410, y: currentY, size: 10, font: fontBold, color: labelColor });

      currentY -= 25;
    });

    // Total Amount Box
    page.drawRectangle({
      x: 270,
      y: currentY - 45,
      width: 230,
      height: 50,
      color: lightBg,
      borderColor: accentBlue,
      borderWidth: 1.5
    });

    page.drawText('TOTAL AMOUNT DUE', { x: 285, y: currentY - 15, size: 9, font: fontBold, color: grayText });
    page.drawText(`Rs. ${totalAmount.toLocaleString('en-IN')}`, { x: 285, y: currentY - 37, size: 16, font: fontBold, color: accentBlue });

    // Footer
    page.drawLine({
      start: { x: 50, y: 70 },
      end: { x: 500, y: 70 },
      thickness: 1,
      color: borderColor
    });

    page.drawText('Thank you for your prompt payment.', {
      x: 180,
      y: 50,
      size: 10,
      font: fontRegular,
      color: grayText
    });

    page.drawText('Generated electronically by PropertyBills Management System', {
      x: 135,
      y: 38,
      size: 8,
      font: fontRegular,
      color: grayText
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invNum}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating PDF invoice:', err);
    res.status(500).json({ message: 'Server error while generating invoice PDF' });
  }
});

// GET /api/invoices/receipt/:paymentId - PDF Payment Receipt Generation
router.get('/receipt/:paymentId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID format' });
    }

    const payment = await Payment.findById(req.params.paymentId).populate({
      path: 'billId',
      populate: { path: 'unitId tenantId' }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment receipt not found' });
    }

    const bill = payment.billId;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 620]);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const primaryColor = rgb(0.12, 0.16, 0.24);
    const emeraldGreen = rgb(0.02, 0.6, 0.42);
    const darkText = rgb(0.1, 0.12, 0.15);
    const grayText = rgb(0.4, 0.45, 0.52);
    const lightBg = rgb(0.95, 0.98, 0.96);
    const borderColor = rgb(0.85, 0.92, 0.88);

    const rctNum = payment._id.toString().slice(-6).toUpperCase();
    const tenantName = bill?.tenantId?.name || 'Valued Tenant';
    const unitLabel = bill?.unitId?.unitNumber ? `Unit ${bill.unitId.unitNumber}` : 'Rental Unit';
    const invNum = bill?.invoiceNumber || 'N/A';
    const month = bill?.month || 'N/A';
    const amountPaid = Number(payment.amountPaid || 0);

    // Outer Container
    page.drawRectangle({
      x: 25,
      y: 25,
      width: 450,
      height: 570,
      borderColor: emeraldGreen,
      borderWidth: 1.5,
      color: rgb(1, 1, 1)
    });

    // Top Receipt Banner
    page.drawRectangle({
      x: 25,
      y: 535,
      width: 450,
      height: 60,
      color: emeraldGreen
    });

    page.drawText('PROPERTYBILLS', {
      x: 45,
      y: 570,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('OFFICIAL PAYMENT RECEIPT', {
      x: 45,
      y: 550,
      size: 10,
      font: fontRegular,
      color: rgb(0.9, 1, 0.9)
    });

    page.drawText(`RECEIPT #${rctNum}`, {
      x: 340,
      y: 565,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText(`Date: ${formatDate(payment.paymentDate || payment.createdAt)}`, {
      x: 340,
      y: 550,
      size: 9,
      font: fontRegular,
      color: rgb(0.9, 1, 0.9)
    });

    // Details Grid Container
    page.drawRectangle({
      x: 45,
      y: 380,
      width: 410,
      height: 130,
      color: lightBg,
      borderColor,
      borderWidth: 1
    });

    page.drawText('PAYMENT DETAILS', { x: 60, y: 492, size: 9, font: fontBold, color: emeraldGreen });
    page.drawLine({ start: { x: 45, y: 482 }, end: { x: 455, y: 482 }, thickness: 0.5, color: borderColor });

    page.drawText('Received From:', { x: 60, y: 462, size: 10, font: fontRegular, color: grayText });
    page.drawText(tenantName, { x: 160, y: 462, size: 11, font: fontBold, color: darkText });

    page.drawText('Rental Unit:', { x: 60, y: 442, size: 10, font: fontRegular, color: grayText });
    page.drawText(unitLabel, { x: 160, y: 442, size: 10, font: fontBold, color: darkText });

    page.drawText('Invoice Reference:', { x: 60, y: 422, size: 10, font: fontRegular, color: grayText });
    page.drawText(`#${invNum}`, { x: 160, y: 422, size: 10, font: fontBold, color: darkText });

    page.drawText('Billing Month:', { x: 60, y: 402, size: 10, font: fontRegular, color: grayText });
    page.drawText(month, { x: 160, y: 402, size: 10, font: fontBold, color: darkText });

    // Payment Method & Reference
    page.drawText('Payment Method:', { x: 60, y: 345, size: 10, font: fontRegular, color: grayText });
    page.drawText(payment.method || 'Cash', { x: 160, y: 345, size: 10, font: fontBold, color: darkText });

    if (payment.transactionRef) {
      page.drawText('Transaction Ref:', { x: 60, y: 325, size: 10, font: fontRegular, color: grayText });
      page.drawText(payment.transactionRef, { x: 160, y: 325, size: 10, font: fontRegular, color: darkText });
    }

    // Featured Amount Paid Box
    page.drawRectangle({
      x: 45,
      y: 220,
      width: 410,
      height: 75,
      color: lightBg,
      borderColor: emeraldGreen,
      borderWidth: 1.5
    });

    page.drawText('AMOUNT RECEIVED', { x: 60, y: 272, size: 10, font: fontBold, color: emeraldGreen });
    page.drawText(`Rs. ${amountPaid.toLocaleString('en-IN')}`, { x: 60, y: 240, size: 22, font: fontBold, color: emeraldGreen });

    // Status Footer Box
    page.drawText(`Bill Total: Rs. ${(bill?.totalAmount || 0).toLocaleString('en-IN')}`, { x: 60, y: 175, size: 10, font: fontRegular, color: grayText });
    page.drawText(`Current Bill Status: ${bill?.status || 'Paid'}`, { x: 60, y: 155, size: 10, font: fontBold, color: primaryColor });

    // Footer Divider
    page.drawLine({
      start: { x: 45, y: 80 },
      end: { x: 455, y: 80 },
      thickness: 1,
      color: borderColor
    });

    page.drawText('Thank you for your payment!', {
      x: 175,
      y: 60,
      size: 11,
      font: fontBold,
      color: emeraldGreen
    });

    page.drawText('This is a computer-generated official payment receipt.', {
      x: 125,
      y: 42,
      size: 8,
      font: fontRegular,
      color: grayText
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${rctNum}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating payment receipt PDF:', err);
    res.status(500).json({ message: 'Server error while generating payment receipt PDF' });
  }
});

export default router;
