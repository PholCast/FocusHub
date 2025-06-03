import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly apiUrl = 'http://localhost:3000/productivity/stats'; 
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  private getHeaders() {
    const token = this.tokenService.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  getSessionsData() {
    return this.http.get<any[]>(`${this.apiUrl}`, this.getHeaders()).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error al obtener sesiones', error);
        return of([]); 
      })
    );
  }
}
