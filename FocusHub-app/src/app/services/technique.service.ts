import { Injectable, signal, WritableSignal } from '@angular/core';
import { Technique } from '../shared/interfaces/technique.interface';

@Injectable({
  providedIn: 'root'
})
export class TechniqueService {
  private techniquesMap: WritableSignal<{ [key: string]: Technique }> = signal({
    pomodoro: {
      name: 'Pomodoro',
      workTime: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
    },
    '5217': {
      name: 'Técnica 52/17',
      workTime: 52 * 60,
      shortBreak: 17 * 60,
      longBreak: 0,
    },
    '9020': {
      name: 'Técnica 90/20',
      workTime: 90 * 60,
      shortBreak: 20 * 60,
      longBreak: 0,
    }
  });

  get techniques() {
    return this.techniquesMap.asReadonly();
  }

  getTechnique(id: string): Technique | undefined {
    return this.techniquesMap()[id];
  }

  addTechnique(id: string, technique: Technique): void {
    const current = this.techniquesMap();
    this.techniquesMap.set({
      ...current,
      [id]: technique
    });
  }

  deleteTechnique(id: string): void {
    const { [id]: _, ...rest } = this.techniquesMap();
    this.techniquesMap.set(rest);
  }

  updateTechnique(id: string, updated: Technique): void {
    const current = this.techniquesMap();
    if (current[id]) {
      this.techniquesMap.set({
        ...current,
        [id]: updated
      });
    }
  }

  exists(id: string): boolean {
    return !!this.techniquesMap()[id];
  }
}
