import express from 'express';
import Notification from '../models/Notification.js';
import Bill from '../models/Bill.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get current user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id
      },
      {
        read: true
      },
      {
        new: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manual-trigger due date reminders endpoint
router.post('/send-reminders', auth, async (req, res) => {
  try {
    const dueSoon = await Bill.find({
      status: 'Pending',
      dueDate: { $lte: new Date(Date.now() + 3 * 86400000) }
    }).populate('tenantId');

    for (const bill of dueSoon) {
      await Notification.create({
        userId: req.user.id,
        message: `Bill ${bill.invoiceNumber} due soon`,
        type: 'due_reminder'
      });
    }

    res.json({ sent: dueSoon.length });
  } catch (err) {
    console.error('Error sending due reminders:', err);
    res.status(500).json({ message: err.message || 'Server error sending due reminders' });
  }
});

export default router;
