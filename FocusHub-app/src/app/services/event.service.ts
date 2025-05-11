import { Injectable } from '@angular/core';
import { CalendarEvent } from '../shared/interfaces/calendar-event.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Use a BehaviorSubject to hold the event data reactively
  private _eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);

  // Expose the events data as an Observable for components to subscribe to
  events$: Observable<CalendarEvent[]> = this._eventsSubject.asObservable();

  constructor() {
    // Load initial events from localStorage when the service is created
    this.loadEventsFromStorage();
  }

  private loadEventsFromStorage(): void {
    const events = localStorage.getItem('calendarEvents');
    const loadedEvents: CalendarEvent[] = events ? JSON.parse(events) : [];
    // Sort events by start time immediately after loading
    loadedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    this._eventsSubject.next(loadedEvents); // Emit the loaded events
  }

  private saveEventsToStorage(events: CalendarEvent[]): void {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }

  addEvent(event: CalendarEvent): void {
    // Get the current events from the subject's value
    const currentEvents = this._eventsSubject.value;
    // Simple ID generation: find the max ID and add 1. Be cautious with this in real apps (potential for duplicates).
    event.id = currentEvents.length > 0 ? Math.max(...currentEvents.map(e => e.id || 0)) + 1 : 1;
    const updatedEvents = [...currentEvents, event]; // Create a new array

    // Sort the updated events before saving and emitting
    updatedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    this.saveEventsToStorage(updatedEvents); // Save to localStorage
    this._eventsSubject.next(updatedEvents); // Emit the new array to subscribers
  }

  updateEvent(updatedEvent: CalendarEvent): void {
    const currentEvents = this._eventsSubject.value;
    const updatedEvents = currentEvents.map(event =>
      event.id === updatedEvent.id ? updatedEvent : event
    );

     // Sort the updated events before saving and emitting
    updatedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    this.saveEventsToStorage(updatedEvents); // Save to localStorage
    this._eventsSubject.next(updatedEvents); // Emit the new array to subscribers
  }

  deleteEvent(id: number): void {
    const currentEvents = this._eventsSubject.value;
    const updatedEvents = currentEvents.filter(event => event.id !== id);

     // Sort the updated events before saving and emitting (optional for delete but good practice)
    updatedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    this.saveEventsToStorage(updatedEvents); // Save to localStorage
    this._eventsSubject.next(updatedEvents); // Emit the new array to subscribers
  }
}