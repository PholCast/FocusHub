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

  addEvent(event: Omit<CalendarEvent, 'id'>): void {
    const currentEvents = this._eventsSubject.value;
    const newEvent: CalendarEvent = {
      ...event,
      id: currentEvents.length > 0 ? Math.max(...currentEvents.map(e => e.id)) + 1 : 1,
      description: event.description || undefined,
      createdAt: event.createdAt || new Date().toISOString(),
      user_id: null,
      category_id: null
    };
    
    const updatedEvents = [...currentEvents, newEvent];
    updatedEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    this.saveEventsToStorage(updatedEvents);
    this._eventsSubject.next(updatedEvents);
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