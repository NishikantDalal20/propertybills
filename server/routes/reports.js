import express from 'express';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Bill from '../models/Bill.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper to escape CSV values for Excel compatibility
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// Helper to format currency
const formatCurr = (num) => `Rs. ${(Number(num) || 0).toLocaleString('en-IN')}`;

// Helper to format date
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

/**
 * GET /api/reports/revenue-pdf
 * Generates a styled Monthly Revenue Report PDF using pdf-lib
 */
router.get('/revenue-pdf', auth, async (req, res) => {
  try {
    const { month } = req.query;

    const query = { status: 'Paid' };
    if (month) {
      query.month = month;
    }

    const paidBills = await Bill.find(query).populate('unitId tenantId').sort({ month: -1, createdAt: -1 });

    // Grouping by month
    const monthlySummaryMap = {};
    let grandTotalRevenue = 0;

    paidBills.forEach((bill) => {
      const m = bill.month || 'Uncategorized';
      if (!monthlySummaryMap[m]) {
        monthlySummaryMap[m] = {
          month: m,
          count: 0,
          rent: 0,
          electricity: 0,
          water: 0,
          maintenance: 0,
          other: 0,
          total: 0
        };
      }
      monthlySummaryMap[m].count += 1;
      monthlySummaryMap[m].rent += Number(bill.rent || 0);
      monthlySummaryMap[m].electricity += Number(bill.electricity || 0);
      monthlySummaryMap[m].water += Number(bill.water || 0);
      monthlySummaryMap[m].maintenance += Number(bill.maintenance || 0);
      monthlySummaryMap[m].other += Number(bill.otherCharges || 0);
      
      const billTotal = bill.totalAmount !== undefined 
        ? Number(bill.totalAmount) 
        : (Number(bill.rent || 0) + Number(bill.electricity || 0) + Number(bill.water || 0) + Number(bill.maintenance || 0) + Number(bill.otherCharges || 0) - Number(bill.discount || 0));

      monthlySummaryMap[m].total += billTotal;
      grandTotalRevenue += billTotal;
    });

    const monthlySummaries = Object.values(monthlySummaryMap);

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 dimensions
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors matching dashboard theme
    const primaryColor = rgb(0.12, 0.16, 0.24); // Dark Navy
    const accentBlue = rgb(0.15, 0.38, 0.92);   // SaaS Blue
    const emeraldGreen = rgb(0.02, 0.6, 0.42); // Emerald
    const grayText = rgb(0.4, 0.45, 0.52);
    const darkText = rgb(0.1, 0.12, 0.15);
    const lightBg = rgb(0.96, 0.97, 0.98);
    const borderColor = rgb(0.88, 0.9, 0.93);

    // Page Border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: 535,
      height: 782,
      borderColor,
      borderWidth: 1,
      color: rgb(1, 1, 1)
    });

    // Header Banner
    page.drawRectangle({
      x: 30,
      y: 742,
      width: 535,
      height: 70,
      color: lightBg
    });

    page.drawText('PROPERTYBILLS', {
      x: 50,
      y: 782,
      size: 18,
      font: fontBold,
      color: primaryColor
    });

    page.drawText('Property Management System — Financial Reports', {
      x: 50,
      y: 762,
      size: 10,
      font: fontRegular,
      color: grayText
    });

    page.drawText('REVENUE REPORT', {
      x: 410,
      y: 782,
      size: 12,
      font: fontBold,
      color: accentBlue
    });

    page.drawText(`Generated: ${formatDate(new Date())}`, {
      x: 410,
      y: 762,
      size: 9,
      font: fontRegular,
      color: grayText
    });

    // Divider
    page.drawLine({
      start: { x: 30, y: 742 },
      end: { x: 565, y: 742 },
      thickness: 1,
      color: borderColor
    });

    // Summary Card Box
    page.drawRectangle({
      x: 50,
      y: 655,
      width: 495,
      height: 70,
      color: lightBg,
      borderColor: accentBlue,
      borderWidth: 1.5
    });

    page.drawText('TOTAL REVENUE COLLECTED', { x: 70, y: 705, size: 9, font: fontBold, color: grayText });
    page.drawText(formatCurr(grandTotalRevenue), { x: 70, y: 675, size: 20, font: fontBold, color: emeraldGreen });

    page.drawText('PAID TRANSACTIONS', { x: 320, y: 705, size: 9, font: fontBold, color: grayText });
    page.drawText(`${paidBills.length} Bill(s)`, { x: 320, y: 675, size: 18, font: fontBold, color: primaryColor });

    // Table Title
    page.drawText('Monthly Breakdown', { x: 50, y: 630, size: 12, font: fontBold, color: darkText });

    // Table Header Box
    page.drawRectangle({
      x: 50,
      y: 595,
      width: 495,
      height: 25,
      color: primaryColor
    });

    page.drawText('MONTH', { x: 65, y: 603, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('BILLS', { x: 160, y: 603, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('RENT', { x: 230, y: 603, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('UTILITIES', { x: 340, y: 603, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('TOTAL REVENUE', { x: 440, y: 603, size: 9, font: fontBold, color: rgb(1, 1, 1) });

    let currentY = 570;

    if (monthlySummaries.length === 0) {
      page.drawText('No paid revenue data available.', { x: 65, y: currentY, size: 10, font: fontRegular, color: grayText });
    } else {
      monthlySummaries.forEach((sum) => {
        page.drawLine({
          start: { x: 50, y: currentY - 8 },
          end: { x: 545, y: currentY - 8 },
          thickness: 0.5,
          color: borderColor
        });

        const utilTotal = sum.electricity + sum.water + sum.maintenance + sum.other;

        page.drawText(sum.month, { x: 65, y: currentY, size: 10, font: fontBold, color: darkText });
        page.drawText(`${sum.count}`, { x: 165, y: currentY, size: 10, font: fontRegular, color: darkText });
        page.drawText(formatCurr(sum.rent), { x: 230, y: currentY, size: 10, font: fontRegular, color: darkText });
        page.drawText(formatCurr(utilTotal), { x: 340, y: currentY, size: 10, font: fontRegular, color: darkText });
        page.drawText(formatCurr(sum.total), { x: 440, y: currentY, size: 10, font: fontBold, color: emeraldGreen });

        currentY -= 25;
      });
    }

    // Recent Transactions Section
    currentY -= 20;
    page.drawText('Recent Paid Invoices', { x: 50, y: currentY, size: 12, font: fontBold, color: darkText });

    currentY -= 30;
    page.drawRectangle({
      x: 50,
      y: currentY,
      width: 495,
      height: 25,
      color: accentBlue
    });

    page.drawText('INVOICE #', { x: 65, y: currentY + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('TENANT / UNIT', { x: 170, y: currentY + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('MONTH', { x: 350, y: currentY + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('AMOUNT', { x: 440, y: currentY + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });

    currentY -= 25;
    const recentBills = paidBills.slice(0, 10); // Display top 10

    if (recentBills.length === 0) {
      page.drawText('No paid invoice records.', { x: 65, y: currentY, size: 10, font: fontRegular, color: grayText });
    } else {
      recentBills.forEach((b) => {
        page.drawLine({
          start: { x: 50, y: currentY - 8 },
          end: { x: 545, y: currentY - 8 },
          thickness: 0.5,
          color: borderColor
        });

        const invNum = b.invoiceNumber || b._id.toString().slice(-6);
        const tenantName = b.tenantId?.name || 'Tenant';
        const unitNum = b.unitId?.unitNumber ? ` (U-${b.unitId.unitNumber})` : '';

        page.drawText(`#${invNum}`, { x: 65, y: currentY, size: 9, font: fontRegular, color: darkText });
        page.drawText(`${tenantName}${unitNum}`.slice(0, 30), { x: 170, y: currentY, size: 9, font: fontRegular, color: darkText });
        page.drawText(b.month || 'N/A', { x: 350, y: currentY, size: 9, font: fontRegular, color: darkText });
        page.drawText(formatCurr(b.totalAmount || 0), { x: 440, y: currentY, size: 9, font: fontBold, color: emeraldGreen });

        currentY -= 22;
      });
    }

    // Footer
    page.drawLine({
      start: { x: 50, y: 60 },
      end: { x: 545, y: 60 },
      thickness: 1,
      color: borderColor
    });

    page.drawText('Electronically generated by PropertyBills Management System', {
      x: 150,
      y: 45,
      size: 9,
      font: fontRegular,
      color: grayText
    });

    const pdfBytes = await pdfDoc.save();

    const filename = month ? `monthly-revenue-report-${month}.pdf` : 'monthly-revenue-report.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating revenue PDF report:', err);
    res.status(500).json({ message: 'Server error while generating revenue report PDF' });
  }
});

/**
 * GET /api/reports/revenue-csv
 * Generates an Excel-compatible CSV for monthly revenue breakdown
 */
router.get('/revenue-csv', auth, async (req, res) => {
  try {
    const paidBills = await Bill.find({ status: 'Paid' }).sort({ month: -1 });

    const summaryMap = {};
    paidBills.forEach((bill) => {
      const m = bill.month || 'Uncategorized';
      if (!summaryMap[m]) {
        summaryMap[m] = {
          month: m,
          count: 0,
          rent: 0,
          electricity: 0,
          water: 0,
          maintenance: 0,
          other: 0,
          discount: 0,
          total: 0
        };
      }
      const rent = Number(bill.rent || 0);
      const electricity = Number(bill.electricity || 0);
      const water = Number(bill.water || 0);
      const maintenance = Number(bill.maintenance || 0);
      const other = Number(bill.otherCharges || 0);
      const discount = Number(bill.discount || 0);
      const total = bill.totalAmount !== undefined ? Number(bill.totalAmount) : (rent + electricity + water + maintenance + other - discount);

      summaryMap[m].count += 1;
      summaryMap[m].rent += rent;
      summaryMap[m].electricity += electricity;
      summaryMap[m].water += water;
      summaryMap[m].maintenance += maintenance;
      summaryMap[m].other += other;
      summaryMap[m].discount += discount;
      summaryMap[m].total += total;
    });

    const rows = [
      ['Month', 'Paid Bills Count', 'Total Rent', 'Total Electricity', 'Total Water', 'Total Maintenance', 'Total Other Charges', 'Total Discount', 'Total Revenue']
    ];

    Object.values(summaryMap).forEach((item) => {
      rows.push([
        item.month,
        item.count,
        item.rent.toFixed(2),
        item.electricity.toFixed(2),
        item.water.toFixed(2),
        item.maintenance.toFixed(2),
        item.other.toFixed(2),
        item.discount.toFixed(2),
        item.total.toFixed(2)
      ]);
    });

    const csvContent = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=monthly-revenue-report.csv');
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating revenue CSV report:', err);
    res.status(500).json({ message: 'Server error while generating revenue CSV report' });
  }
});

/**
 * GET /api/reports/bills-csv
 * Generates an Excel-compatible CSV report of all bills
 */
router.get('/bills-csv', auth, async (req, res) => {
  try {
    const bills = await Bill.find().populate('unitId tenantId').sort({ createdAt: -1 });

    const rows = [
      ['Invoice Number', 'Billing Month', 'Tenant Name', 'Unit Number', 'Status', 'Rent', 'Electricity', 'Water', 'Maintenance', 'Other Charges', 'Discount', 'Late Fee', 'Total Amount', 'Due Date', 'Issue Date']
    ];

    bills.forEach((bill) => {
      const invNum = bill.invoiceNumber || bill._id.toString();
      const month = bill.month || '';
      const tenantName = bill.tenantId?.name || 'N/A';
      const unitNum = bill.unitId?.unitNumber || 'N/A';
      const status = bill.status || 'Pending';
      const rent = Number(bill.rent || 0).toFixed(2);
      const electricity = Number(bill.electricity || 0).toFixed(2);
      const water = Number(bill.water || 0).toFixed(2);
      const maintenance = Number(bill.maintenance || 0).toFixed(2);
      const other = Number(bill.otherCharges || 0).toFixed(2);
      const discount = Number(bill.discount || 0).toFixed(2);
      const lateFee = Number(bill.lateFee || 0).toFixed(2);
      const total = Number(bill.totalAmount || 0).toFixed(2);
      const dueDate = formatDate(bill.dueDate);
      const issueDate = formatDate(bill.createdAt);

      rows.push([
        invNum, month, tenantName, unitNum, status, rent, electricity, water, maintenance, other, discount, lateFee, total, dueDate, issueDate
      ]);
    });

    const csvContent = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=bills-report.csv');
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating bills CSV report:', err);
    res.status(500).json({ message: 'Server error while generating bills CSV report' });
  }
});

export default router;
