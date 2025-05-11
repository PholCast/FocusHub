import { Component, OnInit } from '@angular/core';
import { Task } from '../../shared/interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {
  tasks: Task[] = [];
  selectedTask: Task | null = null;
  showCompleted = false;
  showExpired = false;
  newCategory = '';
  categories: string[] = [];
  newProject = '';
  projects: string[] = [];

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.loadTasks();
    this.categories = this.taskService.getCategories();
    this.projects = this.taskService.getProjects();
  }

  loadTasks(): void {
    this.tasks = this.taskService.getTasks();
  }

  get pendingTasks(): Task[] {
    return this.tasks.filter(task => 
      !task.completed && 
      (!task.dueDate || new Date(task.dueDate) >= new Date())
    );
  }

  get completedTasks(): Task[] {
    return this.tasks.filter(task => task.completed);
  }

  get expiredTasks(): Task[] {
    return this.tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < new Date()
    );
  }

  addTask(title: string): void {
    if (title.trim()) {
      const newTask: Task = {
        id: 0,
        title: title.trim(),
        completed: false,
        createdDate: new Date().toISOString()
      };
      this.taskService.addTask(newTask);
      this.loadTasks();
    }
  }

  toggleComplete(id: number): void {
    this.taskService.toggleComplete(id);
    

    this.tasks = this.tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, completed: !task.completed };
        

        if (this.selectedTask && this.selectedTask.id === id) {
          this.selectedTask = { ...updatedTask };
        }
        
        return updatedTask;
      }
      return task;
    });
  }

  deleteTask(id: number): void {
    this.taskService.deleteTask(id);
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.selectedTask = null;
  }

  openTaskDetails(task: Task): void {
    this.selectedTask = { ...task };
  }

  closeDetails(): void {
    this.selectedTask = null;
  }

  saveTaskDetails(): void {
    if (this.selectedTask && !this.selectedTask.completed) {
      this.taskService.updateTask(this.selectedTask);
      this.tasks = this.tasks.map(task => 
        task.id === this.selectedTask!.id ? this.selectedTask! : task
      );
      this.closeDetails();
    }
  }

  duplicateTask(id: number): void {
    this.taskService.duplicateTask(id);
    this.loadTasks();
    this.closeDetails();
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
}