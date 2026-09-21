import Bill from '../models/Bill.js';
import Notification from '../models/Notification.js';

/**
 * Service to process due-date reminders and overdue notifications.
 * Finds pending/unpaid bills and generates notifications for property owners:
 * 1. Bills due tomorrow -> type: 'due_reminder'
 * 2. Bills due before today -> type: 'overdue'
 *
 * Prevents duplicate notifications per bill, user, and notification type.
 */
export async function processDueDateNotifications() {
  let dueRemindersSent = 0;
  let overdueNotificationsSent = 0;

  // Find all unpaid bills (status Pending or Overdue) and populate unit -> property relationship
  const bills = await Bill.find({
    status: { $ne: 'Paid' }
  }).populate({
    path: 'unitId',
    populate: {
      path: 'propertyId'
    }
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  for (const bill of bills) {
    if (!bill.dueDate) continue;

    const ownerId = bill.unitId?.propertyId?.ownerId;
    if (!ownerId) continue;

    const dueDate = new Date(bill.dueDate);
    const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    // Check if due tomorrow
    if (dueStart.getTime() === tomorrowStart.getTime()) {
      const existing = await Notification.findOne({
        billId: bill._id,
        userId: ownerId,
        type: 'due_reminder'
      });

      if (!existing) {
        await Notification.create({
          userId: ownerId,
          billId: bill._id,
          message: `Bill ${bill.invoiceNumber} is due tomorrow`,
          type: 'due_reminder'
        });
        dueRemindersSent++;
      }
    }
    // Check if overdue (due date before today)
    else if (dueStart.getTime() < todayStart.getTime()) {
      const existing = await Notification.findOne({
        billId: bill._id,
        userId: ownerId,
        type: 'overdue'
      });

      if (!existing) {
        await Notification.create({
          userId: ownerId,
          billId: bill._id,
          message: `Bill ${bill.invoiceNumber} is overdue`,
          type: 'overdue'
        });
        overdueNotificationsSent++;
      }
    }
  }

  return {
    dueRemindersSent,
    overdueNotificationsSent
  };
}
