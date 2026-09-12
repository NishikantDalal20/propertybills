import express from 'express';
import Bill from '../models/Bill.js';
import RentalUnit from '../models/RentalUnit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', auth, async (req, res) => {
  try {
    const totalBills = await Bill.countDocuments();
    const paidBills = await Bill.countDocuments({ status: 'Paid' });
    const pendingBills = await Bill.countDocuments({ status: { $in: ['Pending', 'Partial'] } });
    const occupiedUnits = await RentalUnit.countDocuments({ status: 'Occupied' });
    const vacantUnits = await RentalUnit.countDocuments({ status: 'Vacant' });
    const revenueAgg = await Bill.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalBills,
      paidBills,
      pendingBills,
      occupiedUnits,
      vacantUnits,
      totalRevenue: revenueAgg[0]?.total || 0
    });
  } catch (err) {
    console.error('Error fetching dashboard summary stats:', err);
    res.status(500).json({ message: 'Server error while fetching summary stats' });
  }
});

router.get('/revenue-by-month', auth, async (req, res) => {
  try {
    const data = await Bill.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: '$month', revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    console.error('Error fetching revenue by month stats:', err);
    res.status(500).json({ message: 'Server error while fetching revenue by month stats' });
  }
});

router.get('/payment-status', auth, async (req, res) => {
  try {
    const data = await Bill.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json(data);
  } catch (err) {
    console.error('Error fetching payment status stats:', err);
    res.status(500).json({ message: 'Server error while fetching payment status stats' });
  }
});

export default router;
