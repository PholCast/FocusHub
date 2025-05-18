import { Injectable } from '@angular/core';
import { CalendarEvent } from '../shared/interfaces/calendar-event.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private _eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  events$: Observable<CalendarEvent[]> = this._eventsSubject.asObservable();

  constructor() {
    this.loadEventsFromStorage();
  }

  private loadEventsFromStorage(): void {
    const events = localStorage.getItem('calendarEvents');
    const loadedEvents: CalendarEvent[] = events ? JSON.parse(events) : [];
    loadedEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    this._eventsSubject.next(loadedEvents);
  }

  private saveEventsToStorage(events: CalendarEvent[]): void {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }

  // En tu event.service.ts
  addEvent(event: Omit<CalendarEvent, 'id'>): void {
    const currentEvents = this._eventsSubject.value;
    const newEvent: CalendarEvent = {
      ...event,
      id: currentEvents.length > 0 ? Math.max(...currentEvents.map(e => e.id)) + 1 : 1,
      description: event.description || undefined,
      createdAt: event.createdAt || new Date().toISOString(),
      user_id: null,
      category_id: null,
      // Asegurar que las fechas se guarden como strings ISO sin conversión UTC
      startTime: this.formatDateString(event.startTime),
      endTime: this.formatDateString(event.endTime)
    };

    const updatedEvents = [...currentEvents, newEvent];
    updatedEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    this.saveEventsToStorage(updatedEvents);
    this._eventsSubject.next(updatedEvents);
  }

  // Nueva función auxiliar para formatear fechas correctamente
  private formatDateString(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Si no es una fecha válida, devolver original

    // Formatear manualmente para evitar problemas de zona horaria
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  updateEvent(updatedEvent: CalendarEvent): void {
    const currentEvents = this._eventsSubject.value;
    const updatedEvents = currentEvents.map(event =>
      event.id === updatedEvent.id ? updatedEvent : event
    );

    updatedEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    this.saveEventsToStorage(updatedEvents);
    this._eventsSubject.next(updatedEvents);
  }

  deleteEvent(id: number): void {
    const currentEvents = this._eventsSubject.value;
    const updatedEvents = currentEvents.filter(event => event.id !== id);
    this.saveEventsToStorage(updatedEvents);
    this._eventsSubject.next(updatedEvents);
  }
}
