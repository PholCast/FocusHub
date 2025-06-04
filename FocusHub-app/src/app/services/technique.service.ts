import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Technique } from '../shared/interfaces/technique.interface';
import { TokenService } from './token.service';
import { Observable, tap } from 'rxjs';
import { FocusSession } from '../shared/interfaces/focus_session.interface'; // ¡Solo una interfaz para FocusSession!

@Injectable({
  providedIn: 'root'
})
export class TechniqueService {

  public techniques = signal<Technique[]>([]);
  public techniquesMap = signal<Record<number, Technique>>({}); 
  public focusSessions = signal<FocusSession[]>([]);

  private readonly baseUrl = 'http://backend:3000/productivity/techniques';
  private readonly baseUrlFocusSessions = 'http://backend:3000/productivity/focus-sessions';

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  private getUserId(): number | null {
    console.log("ID CON EL SUB: ",this.tokenService.decodeToken()?.sub);
    return this.tokenService.decodeToken()?.sub ?? null;
  }

  fetchTechniques(): Observable<Technique[]> {
    const userId = this.getUserId();
    if (!userId) {
      console.error('❌ No userId found');
      return new Observable<Technique[]>(); // observable vacío
    }

    console.log(`🔄 Fetching techniques for userId: ${userId}`);

    // El backend ahora obtiene el userId del token para Focus Sessions, pero para Techniques
    // todavía lo pasamos como Query Param.
    return this.http.get<Technique[]>(`${this.baseUrl}?userId=${userId}`, this.getHeaders()).pipe(
      tap((fetched) => {
        console.log('📦 Techniques fetched from server:', fetched);
        
        this.techniques.set(fetched); // Simplemente reemplazamos con las fetched
        this.techniquesMap.set(this.buildTechniqueMapById(fetched)); // Reconstruimos el mapa
        
        console.log('✅ Updated techniques signal:', this.techniques());
        console.log('✅ Updated techniquesMap signal:', this.techniquesMap());
      })
    );
  }

  getTechniqueById(id: number): Technique | undefined {
    return this.techniquesMap()[id];
  }

  // `technique` no tiene `id` al crear
  addTechnique(technique: Omit<Technique, 'id'>): Observable<Technique> { 
    console.log("añadiendo tecnica:", technique)
    const userId = this.getUserId();
    if (!userId) {
      console.error('No userId found');
      return new Observable<Technique>();
    }

    const createDto = {
        name: technique.name,
        workDuration: technique.workTime / 60,    // Convertir a minutos
        breakDuration: technique.shortBreak / 60, // Convertir a minutos
        longBreakDuration: technique.longBreak ? technique.longBreak / 60 : 0, // Convertir a minutos, manejar opcional
        description: technique.description // Si tienes descripción
    };

    return this.http.post<Technique>(`${this.baseUrl}?userId=${userId}`, createDto, this.getHeaders()).pipe(
      tap((newTechnique) => {
        this.techniques.update(currentList => [...currentList, newTechnique]);
        this.techniquesMap.update(currentMap => ({ ...currentMap, [newTechnique.id!]: newTechnique }));
      })
    );
  }

  updateTechnique(id: number, updated: Partial<Omit<Technique, 'id'>>): Observable<Technique> {
    const userId = this.getUserId();
    if (!userId) {
      console.error('No userId found');
      return new Observable<Technique>();
    }

    // Construye el DTO para el backend, convirtiendo a minutos si es necesario
    const updateDto: any = {};
    if (updated.name !== undefined) updateDto.name = updated.name;
    if (updated.workTime !== undefined) updateDto.workDuration = updated.workTime / 60;
    if (updated.shortBreak !== undefined) updateDto.breakDuration = updated.shortBreak / 60;
    if (updated.longBreak !== undefined) updateDto.longBreakDuration = updated.longBreak / 60;
    if (updated.description !== undefined) updateDto.description = updated.description;

    return this.http.patch<Technique>(`${this.baseUrl}/${id}?userId=${userId}`, updateDto, this.getHeaders()).pipe(
      tap((updatedTechnique) => {
        this.techniques.update(currentList => currentList.map(t =>
          t.id === id ? updatedTechnique : t
        ));
        this.techniquesMap.update(currentMap => ({
          ...currentMap,
          [updatedTechnique.id!]: updatedTechnique
        }));
      })
    );
  }

  deleteTechnique(id: number): Observable<void> {
    const userId = this.getUserId();
    if (!userId) {
      console.error('No userId found');
      return new Observable<void>();
    }

    return this.http.delete<void>(`${this.baseUrl}/${id}?userId=${userId}`, this.getHeaders()).pipe(
      tap(() => {
        this.techniques.update(currentList => currentList.filter(t => t.id !== id));
        this.techniquesMap.update(currentMap => {
          const { [id]: removed, ...rest } = currentMap;
          return rest;
        });
      })
    );
  }

  exists(id: number): boolean { // Ahora usa ID para verificar existencia
    return !!this.getTechniqueById(id);
  }

  private getHeaders() {
    const token = this.tokenService.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  private buildTechniqueMapById(techniques: Technique[]): Record<number, Technique> {
    return techniques.reduce((acc, t) => {
      if (t.id) { // Solo si la técnica tiene un ID
        acc[t.id] = t;
      }
      return acc;
    }, {} as Record<number, Technique>);
  }


  loadFocusSessions(): void {
    // Ya no necesitas obtener userId del frontend ni enviarlo como Query Param.
    // El backend lo obtendrá de req.user.userId.
    this.http.get<FocusSession[]>(`${this.baseUrlFocusSessions}`, this.getHeaders()).pipe(
      tap(sessions => {
        this.focusSessions.set(sessions);
        console.log('📈 Sesiones de concentración cargadas:', sessions);
      })
    ).subscribe({
      error: (err) => console.error('Error al cargar las sesiones de concentración:', err)
    });
  }


  createFocusSession(techniqueId: number, status: 'in_progress' | 'paused' | 'completed' = 'in_progress'): Observable<FocusSession> {
    // El payload no necesita userId. El backend espera un DTO sin userId.
    const payload = {
      techniqueId: techniqueId,
      status: status
    };

    console.log('🚀 Creando sesión de concentración (payload sin userId):', payload);

    return this.http.post<FocusSession>(`${this.baseUrlFocusSessions}`, payload, this.getHeaders()).pipe(
      tap(newSession => {
        this.focusSessions.update(current => [newSession, ...current]);
        console.log('✅ Sesión de concentración creada con éxito:', newSession);
      })
    );
  }


  updateFocusSession(sessionId: number, updateData: Partial<FocusSession>): Observable<FocusSession> {
    // Ya no necesitas userId como parámetro ni enviarlo como Query Param.
    // El backend lo obtendrá de req.user.userId.
    return this.http.patch<FocusSession>(`${this.baseUrlFocusSessions}/${sessionId}`, updateData, this.getHeaders()).pipe(
      tap(updatedSession => {
        this.focusSessions.update(current => current.map(s => s.id === updatedSession.id ? updatedSession : s));
        console.log('🔄 Sesión de concentración actualizada:', updatedSession);
      })
    );
  }

  removeFocusSession(sessionId: number): Observable<void> {
    // Ya no necesitas userId como parámetro ni enviarlo como Query Param.
    // El backend lo obtendrá de req.user.userId.
    return this.http.delete<void>(`${this.baseUrlFocusSessions}/${sessionId}`, this.getHeaders()).pipe(
      tap(() => {
        this.focusSessions.update(current => current.filter(s => s.id !== sessionId));
        console.log('🗑️ Sesión de concentración eliminada:', sessionId);
      })
    );
  }

  updateFocusSessionStatus(sessionId: number, status: 'in_progress' | 'paused' | 'completed'): Observable<FocusSession> {
    return this.http.patch<FocusSession>(`${this.baseUrlFocusSessions}/${sessionId}`, { status }, this.getHeaders());
  }
}
