import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TokenService } from './token.service';
import { CalendarEvent } from '../shared/interfaces/calendar-event.interface';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  public events = signal<CalendarEvent[]>([]); // Signal reactiva

  private readonly baseUrl = 'http://backend:3000/events';
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  fetchEvents(): void {
    this.http.get<CalendarEvent[]>(this.baseUrl, this.getHeaders())
      .subscribe({
        next: (data) => this.events.set(data),
        error: (err) => console.error('Error al obtener eventos:', err)
      });
  }

  createEvent(event: Partial<CalendarEvent>): Observable<CalendarEvent> {
    const payload = this.mapEventToDto(event);
    return this.http.post<CalendarEvent>(this.baseUrl, payload, this.getHeaders())
      .pipe(
        tap((newEvent) => {
          // Añade el nuevo evento a la señal local
          const current = this.events();
          this.events.set([...current, newEvent]);
        })
        // Ya no necesitas .subscribe() aquí
      );
  }

  updateEvent(event: Partial<CalendarEvent>): Observable<CalendarEvent> {
    if (!event.id) {
      throw new Error('El evento debe tener un id para poder actualizarse.');
    }
    const payload = this.mapEventToDto(event);
    return this.http.put<CalendarEvent>(`${this.baseUrl}/${event.id}`, payload, this.getHeaders())
      .pipe(
        tap((updatedEvent) => {
          // Actualiza la señal localmente
          const updatedList = this.events().map(ev =>
            ev.id === updatedEvent.id ? updatedEvent : ev
          );
          this.events.set(updatedList);
        })
        // Ya no necesitas .subscribe() aquí, el componente se encargará
      );
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        tap(() => {
          // Elimina el evento de la señal local
          const updatedList = this.events().filter(ev => ev.id !== id);
          this.events.set(updatedList);
        })
      );
  }

  getEventById(id: number): void {
    this.http.get<CalendarEvent>(`${this.baseUrl}/${id}`, this.getHeaders())
      .subscribe({
        next: (event) => {
          const current = this.events();
          const updatedList = current.some(e => e.id === event.id)
            ? current.map(e => (e.id === event.id ? event : e))
            : [...current, event];
          this.events.set(updatedList);
        },
        error: (err) => console.error('Error al obtener evento por ID:', err)
      });
  }

  getEventsByDate(date: string): void {
    this.http.get<CalendarEvent[]>(`${this.baseUrl}/by-date`, {
      ...this.getHeaders(),
      params: { date }
    }).subscribe({
      next: (data) => this.events.set(data),
      error: (err) => console.error('Error al obtener eventos por fecha:', err)
    });
  }

  private mapEventToDto(event: Partial<CalendarEvent>) {
    return {
      title: event.title,
      description: event.description || '',
      startTime: event.startTime,
      endTime: event.endTime || null,
      categoryId: event.category_id || null,
      userId: event.user_id,
    };
  }

  private getHeaders() {
    const token = this.tokenService.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }
}
