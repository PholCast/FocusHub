import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import {CalendarEvent} from '../shared/interfaces/calendar-event.interface';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  public events = signal<CalendarEvent[]>([]); // Signal reactiva

  private readonly baseUrl = 'http://localhost:3000/events'; // Ajusta si cambias prefijo
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  
  createEvent(event: Partial<CalendarEvent>): Observable<CalendarEvent> {
    const payload = this.mapEventToDto(event);
    return this.http.post<CalendarEvent>(this.baseUrl, payload, this.getHeaders()).pipe(
      tap((newEvent) => {
        const current = this.events();
        this.events.set([...current, newEvent]); // ✅ Ya no es `any`
      })
    );
  }
  
  fetchEvents(): void {
    this.getAllEvents().subscribe((data) => {
      this.events.set(data);
    });
  }

  getAllEvents(): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(this.baseUrl, this.getHeaders());
  }

  getEventById(id: number): Observable<CalendarEvent> {
    return this.http.get<CalendarEvent>(`${this.baseUrl}/${id}`, this.getHeaders());
  }



  updateEvent(event: Partial<CalendarEvent>): Observable<CalendarEvent> {
    if (!event.id) {
      throw new Error('El evento debe tener un id para poder actualizarse.');
    }
    const payload = this.mapEventToDto(event);
    return this.http.put<CalendarEvent>(`${this.baseUrl}/${event.id}`, payload, this.getHeaders());
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.getHeaders());
  }

  getEventsByDate(date: string): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.baseUrl}/by-date`, {
      ...this.getHeaders(),
      params: { date }
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
