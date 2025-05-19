import { Injectable } from '@angular/core';
import { CalendarEvent } from '../shared/interfaces/calendar-event.interface';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:3000/events';
  private _eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  public events$ = this._eventsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadEventsFromBackend();
  }

  /** Carga eventos desde el backend y actualiza el observable */
  private loadEventsFromBackend(): void {
    this.http.get<CalendarEvent[]>(this.apiUrl)
      .subscribe(events => {
        events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        this._eventsSubject.next(events);
      });
  }

  /** Mapea el evento al formato esperado por el backend (sin userId) */
  private toCreateEventDto(event: Omit<CalendarEvent, 'id' | 'createdAt'>): any {
    return {
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      categoryId: event.category_id,
    };
  }

  /** Mapea el evento al formato esperado por el backend para actualizaciones (sin userId) */
  private toUpdateEventDto(event: CalendarEvent): any {
    return {
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      categoryId: event.category_id,
    };
  }

  /** Crea un nuevo evento en el backend */
  addEvent(event: Omit<CalendarEvent, 'id'>): void {
    const dto = this.toCreateEventDto(event);
    this.http.post<CalendarEvent>(this.apiUrl, dto)
      .pipe(tap(() => this.loadEventsFromBackend()))
      .subscribe();
  }

  /** Actualiza un evento existente en el backend */
  updateEvent(event: CalendarEvent): void {
    const dto = this.toUpdateEventDto(event);
    this.http.put<CalendarEvent>(`${this.apiUrl}/${event.id}`, dto)
      .pipe(tap(() => this.loadEventsFromBackend()))
      .subscribe();
  }

  /** Elimina un evento del backend */
  deleteEvent(id: number): void {
    this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.loadEventsFromBackend()))
      .subscribe();
  }
}
