import { Component, OnInit, Signal, computed, signal } from '@angular/core';
import { Task } from '../../shared/interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../../shared/components/nav/nav.component';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [NavComponent, CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {

  tasks!: Signal<Task[]>;
  selectedTask: Task | null = null;
  showCompleted = false;
  showExpired = false;

  newCategory = '';
  categories: string[] = [];

  newProject = '';
  projects: string[] = [];

  constructor(private taskService: TaskService) {
    this.tasks = this.taskService.tasks; 
  }

  ngOnInit(): void {
    this.tasks = this.taskService.tasks; // ya es signal del servicio
    this.taskService.loadTasks(); // carga inicial

    this.categories = this.taskService.getCategories();
    this.projects = this.taskService.getProjects();
  }

  get pendingTasks() {
    return this.taskService.pendingTasks();
  }

  get completedTasks(): Task[] {
    return this.taskService.completedTasks();
  }

  get expiredTasks(): Task[] {
    return this.taskService.expiredTasks();
  }

  addTask(title: string): void {
    if (title.trim()) {
      const newTask = {
        title: title.trim(),
        description: '',
        dueDate: undefined,
        category: '',
        project: '',
        user_id: null
      };

      this.taskService.addTask(newTask); // ya actualiza la signal internamente
    }
  }

  toggleComplete(id: number): void {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;

    this.taskService.toggleComplete(task);

    // Actualizar la tarea seleccionada si aplica (se hace justo después porque el service ya actualiza las signals)
    const updated = this.tasks().find(t => t.id === id);
    if (updated && this.selectedTask?.id === id) {
      this.selectedTask = { ...updated };
    }
  }

  deleteTask(id: number): void {
    this.taskService.deleteTask(id);

    if (this.selectedTask?.id === id) {
      this.selectedTask = null;
    }
  }


  openTaskDetails(task: Task): void {
    this.selectedTask = { ...task };
  }

  closeDetails(): void {
    this.selectedTask = null;
  }

  saveTaskDetails(): void {
    if (this.selectedTask && this.selectedTask.status !== 'completed') {
      if (!this.isValidStatus(this.selectedTask.status)) {
        this.selectedTask.status = 'pending';
      }

      this.taskService.updateTask(this.selectedTask);
      this.closeDetails(); // se cierra sincrónicamente
    }
  }

  duplicateTask(id: number): void {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;

    this.taskService.duplicateTask(task);
    this.closeDetails(); // también se cierra sincrónicamente
  }


  confirmDelete(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      this.deleteTask(id);
    }
  }

  addCategory(): void {
    if (this.newCategory.trim()) {
      this.taskService.addCategory(this.newCategory.trim());
      this.categories = this.taskService.getCategories();
      this.newCategory = '';
    }
  }

  addProject(): void {
    if (this.newProject.trim()) {
      this.taskService.addProject(this.newProject.trim());
      this.projects = this.taskService.getProjects();
      this.newProject = '';
    }
  }

  private isValidStatus(status: string): status is Task['status'] {
    return ['pending', 'in_progress', 'completed', 'overdue'].includes(status);
  }
}
