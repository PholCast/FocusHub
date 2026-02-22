import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Technique } from '../shared/interfaces/technique.interface';
import { TokenService } from './token.service';
import { Observable, forkJoin, of, tap, catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TechniqueService {


  public techniques = signal<Technique[]>([]);
  public techniquesMap = signal<Record<string, Technique>>({});
  public currentFocusSessionId = signal<number | null>(null);

  private readonly baseUrl = 'http://localhost:3000/productivity/techniques';
  private readonly sessionsUrl = 'http://localhost:3000/productivity/focus-sessions';
  private readonly sessionTasksUrl = 'http://localhost:3000/productivity/focus-session-tasks';
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  private getUserId(): number | null {
    console.log("ID CON EL SUB: ",this.tokenService.decodeToken()?.sub);
    return this.tokenService.decodeToken()?.sub ?? null;
  }

fetchTechniques(): Observable<Technique[]> {
  const userId = this.getUserId();
  console.log(`🔄 Fetching techniques (global + user${userId ? ` ${userId}` : ''})`);

  const global$ = this.http
    .get<Technique[]>(`${this.baseUrl}/global`, this.getHeaders())
    .pipe(catchError(() => of([])));

  const user$ = userId
    ? this.http
        .get<Technique[]>(`${this.baseUrl}?userId=${userId}`, this.getHeaders())
        .pipe(catchError(() => of([])))
    : of([]);

  return forkJoin([global$, user$]).pipe(
    map(([global, user]) => [...global, ...user]),
    tap((fetched) => {
      console.log('📦 Techniques fetched from server (merged):', fetched);

      // 1️⃣ Actualizamos el array
      this.techniques.set(fetched);

      // 2️⃣ Construimos el mapa desde cero
      const newMap: Record<string, Technique> = {};
      fetched.forEach(t => {
        newMap[t.name] = t;
      });

      this.techniquesMap.set(newMap);
    })
  );
}

  getTechnique(name: string): Technique | undefined {
    return this.techniquesMap()[name];
  }

  addTechnique(technique: Technique): Observable<Technique> {
    console.log("añadiendo tecnica:", technique)
    const userId = this.getUserId();
    if (!userId) {
      console.error('No userId found');
      return new Observable<Technique>();
    }

    return this.http.post<Technique>(`${this.baseUrl}?userId=${userId}`, technique, this.getHeaders()).pipe(
      tap((newTechnique) => {
        const currentList = this.techniques();
        const currentMap = this.techniquesMap();

        // Evitar duplicado
        if (!currentList.some(t => t.name === newTechnique.name)) {
          this.techniques.set([...currentList, newTechnique]);
        }

        if (!currentMap[newTechnique.name]) {
          this.techniquesMap.set({ ...currentMap, [newTechnique.name]: newTechnique });
        }
      })
    );
  }

  updateTechnique(name: string, updated: Technique): Observable<Technique> {
    const userId = this.getUserId();
    if (!userId) {
      console.error('No userId found');
      return new Observable<Technique>();
    }

    return this.http.patch<Technique>(`${this.baseUrl}/${name}?userId=${userId}`, updated, this.getHeaders()).pipe(
      tap((updatedTechnique) => {
        const updatedList = this.techniques().map(t =>
          t.name === name ? updatedTechnique : t
        );
        this.techniques.set(updatedList);

        const currentMap = this.techniquesMap();
        this.techniquesMap.set({
          ...currentMap,
          [updatedTechnique.name]: updatedTechnique
        });
      })
    );
  }

  deleteTechnique(name: string): Observable<void> {
    const userId = this.getUserId();
    if (!userId) {
      console.error('No userId found');
      return new Observable<void>();
    }

    return this.http.delete<void>(`${this.baseUrl}/${name}?userId=${userId}`, this.getHeaders()).pipe(
      tap(() => {
        const updatedList = this.techniques().filter(t => t.name !== name);
        this.techniques.set(updatedList);

        const currentMap = { ...this.techniquesMap() };
        delete currentMap[name];
        this.techniquesMap.set(currentMap);
      })
    );
  }

  exists(name: string): boolean {
    return !!this.getTechnique(name);
  }

  private getHeaders() {
    const token = this.tokenService.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  private buildTechniqueMap(techniques: Technique[]): Record<string, Technique> {
    return techniques.reduce((acc, t) => {
      acc[t.name] = t;
      return acc;
    }, {} as Record<string, Technique>);
  }

  // Focus Sessions Methods
  createFocusSession(userId: number, techniqueId: number): Observable<any> {
    const sessionData = {
      userId,
      techniqueId,
      status: 'in_progress',
    };
    return this.http.post<any>(`${this.sessionsUrl}`, sessionData, this.getHeaders()).pipe(
      tap((session) => {
        this.currentFocusSessionId.set(session.id);
        console.log('✅ Focus session created:', session);
      })
    );
  }

  updateFocusSessionStatus(sessionId: number, status: 'in_progress' | 'paused' | 'completed'): Observable<any> {
    return this.http.patch<any>(`${this.sessionsUrl}/${sessionId}`, { status }, this.getHeaders()).pipe(
      tap((session) => {
        console.log(`✅ Focus session updated to ${status}:`, session);
      })
    );
  }

  addTaskToFocusSession(focusSessionId: number, taskId: number): Observable<any> {
    return this.http.post<any>(`${this.sessionTasksUrl}`, { focusSessionId, taskId }, this.getHeaders()).pipe(
      tap((focusSessionTask) => {
        console.log('✅ Task added to focus session:', focusSessionTask);
      })
    );
  }

  removeTaskFromFocusSession(focusSessionId: number, taskId: number): Observable<any> {
    return this.http.delete<any>(`${this.sessionsUrl}/${focusSessionId}/tasks/${taskId}`, this.getHeaders()).pipe(
      tap(() => {
        console.log(`✅ Task ${taskId} removed from focus session ${focusSessionId}`);
      })
    );
  }
}
