export interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;   
  description?: string;
  createdAt: string | null;
  user_id: number | null;
  category_id?: number | null;
  remindersHoursBefore?: number| null; // e.g., 1, 2, 12, 24 (for 1 day)
  eventReminderId?: number;
}