import { Component, inject } from '@angular/core';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { StatsService } from '../../services/stats.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  imports: [NavComponent,CommonModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent {
  statsService = inject(StatsService);
  sessions: any[] = [];

  completedToday = 0;
  pendingToday = 0;
  progressPercent = 0;
  focusTimeToday = 0;
  mostUsedTechnique = '';

  ngOnInit(): void {
    this.statsService.getSessionsData().subscribe(data => {
      this.sessions = data.map(session => ({
        ...session,
        expanded: false
      }));

      this.processStats();
      console.log(this.sessions)
    });
  }

  toggleSession(session: any) {
    session.expanded = !session.expanded;
  }

  private isSameLocalDay(dateStr: string, date: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

private processStats(): void {
  const today = new Date(); // fecha actual local

  let completedTasks = 0;
  let pendingTasks = 0;
  let focusMinutes = 0;
  const techniqueCount: Record<string, number> = {};

  for (const session of this.sessions) {
    // ¿Esta sesión es de hoy? (local)
    const isTodaySession = this.isSameLocalDay(session.createdAt, today);

    if (isTodaySession && session.status === 'completed') {
      focusMinutes += session.technique.workTime;
    }

    // Contar técnica usada (en todas las sesiones)
    const techniqueName = session.technique.name;
    techniqueCount[techniqueName] = (techniqueCount[techniqueName] || 0) + 1;

    for (const fst of session.focusSessionTasks) {
      // ¿Esta tarea fue creada hoy (local)?
      if (this.isSameLocalDay(fst.task.createdAt, today)) {
        if (fst.task.status === 'completed') completedTasks++;
        if (fst.task.status !== 'completed') pendingTasks++;
      }
    }
  }

  const totalTasks = completedTasks + pendingTasks;

  this.completedToday = completedTasks;
  this.pendingToday = pendingTasks;
  this.progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  this.focusTimeToday = +(focusMinutes / 60).toFixed(1);

  // Técnica más usada global
  this.mostUsedTechnique = Object.entries(techniqueCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

}