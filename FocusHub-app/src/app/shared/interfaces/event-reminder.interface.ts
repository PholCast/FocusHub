// src/app/shared/interfaces/event-reminder.interface.ts
export interface EventReminder {
  id: number;
  reminderTime: string; // ISO string
  notificationType: 'push' | 'desktop';
  status: boolean; // 1 for active, 0 for notified/dismissed
  event: { id: number }; // Only need the event ID here, or full event if desired
}