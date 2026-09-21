import express from 'express';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';
import { processDueDateNotifications } from '../services/dueDateReminderService.js';

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
    const result = await processDueDateNotifications();
    res.json(result);
  } catch (err) {
    console.error('Error sending due reminders:', err);
    res.status(500).json({ message: err.message || 'Server error sending due reminders' });
  }
});

export default router;
