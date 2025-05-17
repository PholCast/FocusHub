export interface CalendarEvent {
  id: number;
  title: string;
  startTime: string; // Cambiado de 'start'
  endTime: string;   // Cambiado de 'end'
  description?: string;
  createdAt: string | null;
  user_id: number | null;
  category_id: number | null;
}