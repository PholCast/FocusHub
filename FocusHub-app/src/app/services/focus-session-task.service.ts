// src/app/services/focus-session-task.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FocusSessionTask } from '../shared/interfaces/focus_session_task.interface'; // Asegúrate de que esta interfaz exista

@Injectable({
  providedIn: 'root'
})
export class FocusSessionTaskService {
  private apiUrl = 'http://backend:3000/productivity'; 
  private http = inject(HttpClient);

  constructor() { }

  private getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('access_token'); 
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }) 
      })
    };
  }

  createFocusSessionTask(focusSessionId: number, taskId: number): Observable<FocusSessionTask> {
    const requestBody = { focusSessionId, taskId };
    return this.http.post<FocusSessionTask>(`${this.apiUrl}/focus-session-tasks`, requestBody, this.getHeaders());
  }

}