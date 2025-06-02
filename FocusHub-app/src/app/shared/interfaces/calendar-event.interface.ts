export interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;   
  description?: string;
  createdAt: string | null;
  user_id: number | null;
  category_id?: number | null;
}