import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Technique } from '../shared/interfaces/technique.interface';
import { TokenService } from './token.service';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TechniqueService {
  private readonly defaultTechniques: Technique[] = [
    {
      name: 'Pomodoro (25/5/15)',
      workTime: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
    },
    {
      name: 'Técnica 52/17',
      workTime: 52 * 60,
      shortBreak: 17 * 60,
      longBreak: 0,
    },
    {
      name: 'Técnica 90/20',
      workTime: 90 * 60,
      shortBreak: 20 * 60,
      longBreak: 0,
    },
  ];

  public techniques = signal<Technique[]>([...this.defaultTechniques]);
  public techniquesMap = signal<Record<string, Technique>>(
    this.buildTechniqueMap(this.defaultTechniques)
  );

  private readonly baseUrl = 'http://localhost:3000/productivity/techniques';
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  private getUserId(): number | null {
    return this.tokenService.decodeToken()?.sub ?? null;
  }

  fetchTechniques(): Observable<Technique[]> {
    const userId = this.getUserId();
    if (!userId) {
      console.error('❌ No userId found');
      return new Observable<Technique[]>(); // observable vacío
    }

    console.log(`🔄 Fetching techniques for userId: ${userId}`);

    return this.http.get<Technique[]>(`${this.baseUrl}?userId=${userId}`, this.getHeaders()).pipe(
      tap((fetched) => {
        console.log('📦 Techniques fetched from server:', fetched);

        const current = this.techniques();
        console.log('📂 Current techniques in signal:', current);

        const merged = [...current];

        fetched.forEach((newT) => {
          const exists = current.some(t => t.name === newT.name);
          if (!exists) {
            console.log(`➕ Adding new technique: ${newT.name}`);
            merged.push(newT);
          } else {
            console.log(`✅ Technique already exists: ${newT.name}`);
          }
        });

        this.techniques.set(merged);
        console.log('✅ Updated techniques signal:', this.techniques());

        const currentMap = { ...this.techniquesMap() };
        fetched.forEach(t => {
          if (!currentMap[t.name]) {
            console.log(`🗺️ Adding to techniquesMap: ${t.name}`);
            currentMap[t.name] = t;
          } else {
            console.log(`📌 Already in techniquesMap: ${t.name}`);
          }
        });

        this.techniquesMap.set(currentMap);
        console.log('✅ Updated techniquesMap signal:', this.techniquesMap());
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
}
