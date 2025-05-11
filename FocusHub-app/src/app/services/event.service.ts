import { Injectable } from '@angular/core';
import { CalendarEvent } from '../shared/interfaces/calendar-event.interface';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor() { }

  getEvents(): CalendarEvent[] {
    const events = localStorage.getItem('calendarEvents');
    return events ? JSON.parse(events) : [];
  }

  addEvent(event: CalendarEvent): void {
    const events = this.getEvents();
    event.id = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
    events.push(event);
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }

  updateEvent(updatedEvent: CalendarEvent): void {
    const events = this.getEvents();
    const updatedEvents = events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    );
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
  }

  deleteEvent(id: number): void {
    const events = this.getEvents();
    const updatedEvents = events.filter(event => event.id !== id);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
  }
}