import express from 'express';
import Bill from '../models/Bill.js';
import RentalUnit from '../models/RentalUnit.js';
import Property from '../models/Property.js';
import auth from '../middleware/auth.js';

const router = express.Router();

async function getUserUnitIds(userId) {
  const properties = await Property.find({ ownerId: userId });
  const propertyIds = properties.map(p => p._id);
  const units = await RentalUnit.find({ propertyId: { $in: propertyIds } });
  return units.map(u => u._id);
}

router.get('/summary', auth, async (req, res) => {
  try {
    const unitIds = await getUserUnitIds(req.user.id);
    const properties = await Property.find({ ownerId: req.user.id });
    const propertyIds = properties.map(p => p._id);

    const totalBills = await Bill.countDocuments({ unitId: { $in: unitIds } });
    const paidBills = await Bill.countDocuments({ unitId: { $in: unitIds }, status: 'Paid' });
    const pendingBills = await Bill.countDocuments({ unitId: { $in: unitIds }, status: { $in: ['Pending', 'Partial'] } });
    const occupiedUnits = await RentalUnit.countDocuments({ propertyId: { $in: propertyIds }, status: 'Occupied' });
    const vacantUnits = await RentalUnit.countDocuments({ propertyId: { $in: propertyIds }, status: 'Vacant' });
    
    const revenueAgg = await Bill.aggregate([
      { $match: { unitId: { $in: unitIds }, status: 'Paid' } },
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
    const unitIds = await getUserUnitIds(req.user.id);
    const data = await Bill.aggregate([
      { $match: { unitId: { $in: unitIds }, status: 'Paid' } },
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
    const unitIds = await getUserUnitIds(req.user.id);
    const data = await Bill.aggregate([
      { $match: { unitId: { $in: unitIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(data);
  } catch (err) {
    console.error('Error fetching payment status stats:', err);
    res.status(500).json({ message: 'Server error while fetching payment status stats' });
  }
});

export default router;