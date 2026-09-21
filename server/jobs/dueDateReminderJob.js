import cron from 'node-cron';
import { processDueDateNotifications } from '../services/dueDateReminderService.js';

export const startDueDateReminderJob = () => {
  // Schedule to run every day at 08:00 AM ('0 8 * * *')
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('[DueDateReminderJob] Starting daily due-date reminder job...');
      const result = await processDueDateNotifications();
      console.log(`[DueDateReminderJob] Due reminders: ${result.dueRemindersSent}, Overdue notifications: ${result.overdueNotificationsSent}`);
    } catch (err) {
      console.error('[DueDateReminderJob] Error running reminder job:', err);
    }
  });

  console.log('[DueDateReminderJob] Scheduler initialized (runs daily at 08:00 AM)');
};
