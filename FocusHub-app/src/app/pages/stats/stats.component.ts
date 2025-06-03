import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { StatsService } from '../../services/stats.service';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-stats',
  imports: [NavComponent,CommonModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent {

  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;

  barChart!: Chart;
  lineChart!: Chart;
  trendChart!: Chart;

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
      this.createCharts();

    });
  }

  private createCharts(): void {
    this.createBarChart();
    this.createLineChart();
    this.createTrendChart();
  }

  private createBarChart(): void {
    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Datos de técnica y horas totales (sumar por técnica)
    const techniqueTimes: Record<string, number> = {};
    for (const session of this.sessions) {
      if (session.status === 'completed') {
        const name = session.technique.name;
        techniqueTimes[name] = (techniqueTimes[name] || 0) + session.technique.workTime / 60;
      }
    }

    if (this.barChart) {
      this.barChart.destroy();
    }

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(techniqueTimes),
        datasets: [{
          label: 'Horas de concentración',
          data: Object.values(techniqueTimes),
          backgroundColor: 'rgba(54, 162, 235, 0.7)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Horas' } },
          x: { title: { display: true, text: 'Técnica' } }
        }
      }
    });
  }

  private createLineChart(): void {
    const ctx = this.lineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Tareas completadas por día (últimos 7 días)
    const today = new Date();
    const tasksPerDay: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      tasksPerDay[key] = 0;
    }

    for (const session of this.sessions) {
      for (const fst of session.focusSessionTasks) {
        const date = fst.task.createdAt.slice(0, 10);
        if (date in tasksPerDay && fst.task.status === 'completed') {
          tasksPerDay[date]++;
        }
      }
    }

    if (this.lineChart) {
      this.lineChart.destroy();
    }

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(tasksPerDay),
        datasets: [{
          label: 'Tareas completadas',
          data: Object.values(tasksPerDay),
          borderColor: 'rgba(255, 99, 132, 0.8)',
          backgroundColor: 'rgba(255, 99, 132, 0.3)',
          fill: false,
          tension: 0.3,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Cantidad de tareas' } },
          x: { title: { display: true, text: 'Fecha' } }
        }
      }
    });
  }

  private createTrendChart(): void {
    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Horas de concentración por día (últimos 7 días)
    const today = new Date();
    const focusPerDay: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      focusPerDay[key] = 0;
    }

    for (const session of this.sessions) {
      if (session.status === 'completed') {
        const date = session.createdAt.slice(0, 10);
        if (date in focusPerDay) {
          focusPerDay[date] += session.technique.workTime / 60;
        }
      }
    }

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(focusPerDay),
        datasets: [{
          label: 'Horas de concentración',
          data: Object.values(focusPerDay),
          borderColor: 'rgba(75, 192, 192, 0.8)',
          backgroundColor: 'rgba(75, 192, 192, 0.3)',
          fill: false,
          tension: 0.3,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Horas' } },
          x: { title: { display: true, text: 'Fecha' } }
        }
      }
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