import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Renderer2, inject, signal, WritableSignal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, interval, Observable, Subscription } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { Technique } from '../../shared/interfaces/technique.interface';
import { TechniqueService } from '../../services/technique.service';
import { Task } from '../../shared/interfaces/task.interface';
import { TaskService } from '../../services/task.service';
import { FocusSession } from '../../shared/interfaces/focus_session.interface';
import { FocusSessionTaskService } from '../../services/focus-session-task.service'; 

@Component({
  selector: 'app-techniques',
  standalone: true,
  imports: [CommonModule, NavComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './techniques.component.html',
  styleUrls: ['./techniques.component.css']
})
export class TechniquesComponent implements OnInit, OnDestroy, AfterViewInit {
  techniqueService = inject(TechniqueService);
  taskService = inject(TaskService);
  focusSessionTaskService = inject(FocusSessionTaskService);

  currentFocusSession: FocusSession | null = null;
  currentTechnique: Technique | null = null; 

  currentMode: 'work' | 'shortBreak' | 'longBreak' = 'work';
  timerIntervalSubscription: Subscription | null = null;
  isRunning: boolean = false;
  pomodoroCount: number = 0;
  isFloatingTimerVisible: boolean = false;
  isNewTechniqueModalVisible = signal(false);
  activeTabIndex = signal(0);

  timeLeft = signal(0); 

  isSelectTaskModalVisible = signal(false);
  public readonly availableTasks = this.taskService.pendingTasks; 
  public readonly tasksForModalSelection = computed(() => {
    const allPending = this.availableTasks();
    const associated = this.associatedTasks();
    return allPending.filter(pendingTask => !associated.some(associatedTask => associatedTask.id === pendingTask.id));
  });

  associatedTasks: WritableSignal<Task[]> = signal([]);
  selectedTasksInModal: Task[] = [];

  fb = inject(FormBuilder);

  newTechniqueForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    workDuration: [null, [Validators.required, Validators.min(1), Validators.max(120)]], // En minutos
    shortBreak: [null, [Validators.required, Validators.min(1), Validators.max(30)]], // En minutos
    longBreak: [0, [Validators.min(0), Validators.max(60)]], // En minutos
  });

  @ViewChild('timerDisplay') timerDisplay!: ElementRef;
  @ViewChild('timerCircle') timerCircle!: ElementRef;
  @ViewChild('techniqueSelect') techniqueSelect!: ElementRef;
  @ViewChild('newTechniqueModal') newTechniqueModal!: ElementRef;
  @ViewChild('newTechniqueFormElement') newTechniqueFormElement!: ElementRef;
  @ViewChild('floatingTimer') floatingTimer!: ElementRef;
  @ViewChild('floatingTimerDisplay') floatingTimerDisplay!: ElementRef;
  @ViewChild('tabButtons') tabButtons!: ElementRef<HTMLCollectionOf<HTMLButtonElement>>;
  
  constructor(private renderer: Renderer2) {
    this.taskService.loadTasks();

    // Cargamos las técnicas y renderizamos las opciones
    this.techniqueService.fetchTechniques().subscribe(() => {
      this.renderTechniqueOptions();
    });
  }

  ngOnInit(): void {
    this.taskService.loadTasks();
    // La suscripción ya está en el constructor, no es necesario duplicarla
  }

  // --- Lógica para renderizar opciones de técnica por ID ---
  renderTechniqueOptions(): void {
    const selectElement = this.techniqueSelect.nativeElement;

    // Limpiar opciones existentes
    while (selectElement.options.length > 0) {
      this.renderer.removeChild(selectElement, selectElement.options[0]);
    }

    // Obtener las técnicas del servicio (ahora es un mapa por ID)
    const techniquesMap = this.techniqueService.techniquesMap();
    const techniquesArray = Object.values(techniquesMap); // Convertir a array para iterar

    if (techniquesArray.length === 0) {
      // Si no hay técnicas, mostrar un mensaje o deshabilitar funcionalidades
      const option = this.renderer.createElement('option');
      this.renderer.setProperty(option, 'value', '');
      this.renderer.setProperty(option, 'textContent', 'No hay técnicas disponibles');
      this.renderer.setProperty(option, 'disabled', true);
      this.renderer.setProperty(option, 'selected', true);
      this.renderer.appendChild(selectElement, option);
      this.currentTechnique = null;
      this.timeLeft.set(0); // Reiniciar el temporizador
      this.updateTimerDisplay();
      this.updateProgressCircle();
      return;
    }

    // Añadir cada técnica como una nueva opción al <select>, usando el ID como valor
    techniquesArray.forEach(technique => {
      const option = this.renderer.createElement('option');
      this.renderer.setProperty(option, 'value', technique.id?.toString()); // Usar el ID como valor
      this.renderer.setProperty(option, 'textContent', technique.name);
      this.renderer.appendChild(selectElement, option);
    });

    // Seleccionar la primera técnica disponible del backend
    // Opcional: Podrías intentar seleccionar una "Pomodoro" si la tienes con un ID fijo en DB
    if (techniquesArray.length > 0) {
      this.currentTechnique = techniquesArray[0]; // Selecciona la primera cargada
      this.renderer.setProperty(selectElement, 'value', techniquesArray[0].id?.toString());
    } else {
      this.currentTechnique = null;
    }
    
    if (this.currentTechnique) {
        this.timeLeft.set(this.currentTechnique.workTime);
    } else {
        this.timeLeft.set(0); // Si no hay técnica seleccionada, el tiempo es 0
    }
    
    this.updateTimerDisplay();
    this.updateProgressCircle();
    this.setActiveTab(0);
  }

  ngAfterViewInit(): void {
    // Si currentTechnique no es null, inicializa el temporizador.
    // Esto se ejecutará después de que `renderTechniqueOptions` pueda haber establecido `currentTechnique`.
    if (this.currentTechnique) {
      this.timeLeft.set(this.currentTechnique.workTime);
    }
    this.updateTimerDisplay();
    this.updateProgressCircle();
    this.setActiveTab(0);
  }

  ngOnDestroy(): void {
    if (this.timerIntervalSubscription) {
      this.timerIntervalSubscription.unsubscribe();
    }
  }

  updateTimerDisplay(): void {
    const minutes = Math.floor(this.timeLeft() / 60);
    const seconds = this.timeLeft() % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.renderer.setProperty(this.timerDisplay.nativeElement, 'textContent', formattedTime);
    if (this.floatingTimerDisplay) {
      this.renderer.setProperty(this.floatingTimerDisplay.nativeElement, 'textContent', formattedTime);
    }
  }

  updateProgressCircle(): void {
    let totalTime: number;
    if (this.currentTechnique) { 
        if (this.currentMode === 'work') {
            totalTime = this.currentTechnique.workTime;
        } else if (this.currentMode === 'shortBreak') {
            totalTime = this.currentTechnique.shortBreak;
        } else {
            totalTime = this.currentTechnique.longBreak;
        }
    } else {
        totalTime = 1; 
    }


    const progress = (this.timeLeft() / totalTime) * 100;
    this.renderer.setStyle(
      this.timerCircle.nativeElement,
      'background',
      `conic-gradient(var(--accent-color) ${360 - progress * 3.6}deg, var(--secondary-bg) ${
        360 - progress * 3.6
      }deg)`
    );
  }

  startTimer(): void {
    if (this.isRunning) return;
    if (!this.currentTechnique || this.currentTechnique.id === undefined || this.currentTechnique.id === null) {
      console.error('❌ No se puede iniciar la Focus Session: la técnica actual no tiene un ID válido. Por favor, selecciona o crea una técnica.');
      alert('Error: Por favor, selecciona una técnica guardada o crea una nueva para iniciar una sesión de concentración.');
      return;
    }
    console.log("TECNICA SELECCIONADA PARA HACER LA SESIÓN", this.currentTechnique);
    if (this.currentMode === 'work') {
      if (this.currentFocusSession && this.currentFocusSession.status === 'in_progress') {
          this.startActualTimer(); 
          return;
      }

      const techniqueId = this.currentTechnique.id;

      console.log(`✨ Intentando crear Focus Session para techniqueId: ${techniqueId}`);
      this.techniqueService.createFocusSession(techniqueId, 'in_progress').subscribe({
        next: (newSession: FocusSession) => {
          console.log('✅ Focus Session creada con éxito:', newSession);
          this.currentFocusSession = newSession; // <-- ¡Guarda la sesión creada aquí!
          console.log('Focus Session actual guardada:', this.currentFocusSession);
          this.startActualTimer(); 
        },
        error: (err) => {
          console.error('❌ Error al crear Focus Session:', err);
          alert('Error al iniciar la sesión de concentración. Intenta de nuevo.');
          this.isRunning = false; 
        }
      });
    } else {
      this.startActualTimer();
    }
  }

  private startActualTimer(): void {
    this.isRunning = true;
    this.timerIntervalSubscription = interval(1000).subscribe(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.update(value => value - 1);
        this.updateTimerDisplay();
        this.updateProgressCircle();
      } else {
        this.stopTimer();
        this.playNotificationSound();
        this.switchToNextMode();
      }
    });
  }

  stopTimer(): void {
    if (!this.isRunning) return;
    if (this.timerIntervalSubscription) {
      this.timerIntervalSubscription.unsubscribe();
      this.timerIntervalSubscription = null;
    }
    this.isRunning = false;
  }

 resetTimer(): void {
    this.stopTimer();

    if (this.currentFocusSession && this.currentFocusSession.id && this.currentMode === 'work') {
      console.log(`🔚 Reiniciando temporizador en modo trabajo. Marcando Focus Session ${this.currentFocusSession.id} como 'completed'.`);

      const sessionIdToComplete = this.currentFocusSession.id;
      const tasksToAssociate = [...this.associatedTasks()]; // Copiamos las tareas asociadas

      this.techniqueService.updateFocusSessionStatus(sessionIdToComplete, 'completed').subscribe({
        next: (updatedSession) => {
          console.log('✅ Focus Session actualizada a completada al reiniciar:', updatedSession);
          this.currentFocusSession = null; // Limpia la sesión actual

          // **LÓGICA PARA ASOCIAR TAREAS (CORREGIDA)**
          if (tasksToAssociate.length > 0) {
            console.log(`🔗 Preparando para asociar ${tasksToAssociate.length} tareas a la Focus Session ${sessionIdToComplete}.`);

            // Creamos un array de Observables de las llamadas a createFocusSessionTask
            const associationObservables: Observable<any>[] = [];
            tasksToAssociate.forEach(task => {
              if (task.id) {
                // Aquí se crea el Observable, pero la petición no se envía AÚN
                associationObservables.push(this.focusSessionTaskService.createFocusSessionTask(sessionIdToComplete, task.id));
              }
            });

            if (associationObservables.length > 0) {
              // forkJoin se suscribe a todos los Observables en el array y emite cuando todos completan.
              // Es aquí donde las peticiones HTTP se envían.
              forkJoin(associationObservables).subscribe({
                next: (results) => {
                  console.log('✅ Todas las FocusSessionTasks creadas con éxito:', results);
                  this.associatedTasks.set([]); // Limpia las tareas asociadas después de guardarlas
                },
                error: (assocErr) => {
                  console.error('❌ Error al crear una o más FocusSessionTasks:', assocErr);
                  alert('Error al asociar tareas a la sesión. Revisa la consola.');
                }
              });
            } else {
                console.log('No hay tareas válidas para asociar.');
            }
          } else {
              console.log('No hay tareas asociadas para guardar en esta sesión.');
          }
        },
        error: (err) => {
          console.error('❌ Error al actualizar Focus Session a completada al reiniciar:', err);
          alert('Error al finalizar la sesión actual. Intenta de nuevo.');
        }
      });
    } else {
      this.currentFocusSession = null;
      this.associatedTasks.set([]);
    }

    // ... (resto de la función resetTimer sin cambios)
    if (!this.currentTechnique) {
      this.timeLeft.set(0);
      return;
    }
    if (this.currentMode === 'work') {
      this.timeLeft.set(this.currentTechnique.workTime);
    } else if (this.currentMode === 'shortBreak') {
      this.timeLeft.set(this.currentTechnique.shortBreak);
    } else {
      this.timeLeft.set(this.currentTechnique.longBreak);
    }
    this.updateTimerDisplay();
    this.updateProgressCircle();
  }


  setActiveTab(index: number): void {
    const tabButtonsArray = Array.from(this.tabButtons.nativeElement);
    tabButtonsArray.forEach((button, i) => {
      if (i === index) {
        this.renderer.addClass(button, 'active');
      } else {
        this.renderer.removeClass(button, 'active');
      }
    });
    this.activeTabIndex.set(index);
    this.stopTimer();

    if (!this.currentTechnique) {
        this.timeLeft.set(0);
        this.updateTimerDisplay();
        this.updateProgressCircle();
        return;
    }

    if (index === 0) {
      this.currentMode = 'work';
      this.timeLeft.set(this.currentTechnique.workTime);
    } else if (index === 1) {
      this.currentMode = 'shortBreak';
      this.timeLeft.set(this.currentTechnique.shortBreak);
    } else {
      this.currentMode = 'longBreak';
      this.timeLeft.set(this.currentTechnique.longBreak);
    }
    this.updateTimerDisplay();
    this.updateProgressCircle();
  }

  switchToNextMode(): void {
    if (!this.currentTechnique) return;

    if (this.currentMode === 'work') {
      this.pomodoroCount++;

      if (this.currentFocusSession && this.currentFocusSession.id) {
        console.log(`🎉 Temporizador de trabajo finalizado. Marcando Focus Session ${this.currentFocusSession.id} como 'completed'.`);

        const sessionIdToComplete = this.currentFocusSession.id;
        const tasksToAssociate = [...this.associatedTasks()]; // Copiamos las tareas asociadas

        this.techniqueService.updateFocusSessionStatus(sessionIdToComplete, 'completed').subscribe({
          next: (updatedSession) => {
            console.log('✅ Focus Session actualizada a completada:', updatedSession);
            this.currentFocusSession = null; // Limpia la sesión actual

            // **LÓGICA PARA ASOCIAR TAREAS (CORREGIDA)**
            if (tasksToAssociate.length > 0) {
              console.log(`🔗 Preparando para asociar ${tasksToAssociate.length} tareas a la Focus Session ${sessionIdToComplete}.`);

              const associationObservables: Observable<any>[] = [];
              tasksToAssociate.forEach(task => {
                if (task.id) {
                  associationObservables.push(this.focusSessionTaskService.createFocusSessionTask(sessionIdToComplete, task.id));
                }
              });

              if (associationObservables.length > 0) {
                forkJoin(associationObservables).subscribe({
                  next: (results) => {
                    console.log('✅ Todas las FocusSessionTasks creadas con éxito:', results);
                    this.associatedTasks.set([]);
                  },
                  error: (assocErr) => {
                    console.error('❌ Error al crear una o más FocusSessionTasks:', assocErr);
                    alert('Error al asociar tareas a la sesión. Revisa la consola.');
                  }
                });
              } else {
                  console.log('No hay tareas válidas para asociar.');
              }
            } else {
                console.log('No hay tareas asociadas para guardar en esta sesión.');
            }
          },
          error: (err) => {
            console.error('❌ Error al actualizar Focus Session a completada:', err);
            alert('Error al finalizar la sesión actual. Intenta de nuevo.');
          }
        });
      }
      // ... (resto de la función switchToNextMode sin cambios para la lógica del temporizador)
      if (this.pomodoroCount % 4 === 0 && this.currentTechnique.longBreak > 0) {
        this.currentMode = 'longBreak';
        this.timeLeft.set(this.currentTechnique.longBreak);
        this.setActiveTab(2);
      } else {
        this.currentMode = 'shortBreak';
        this.timeLeft.set(this.currentTechnique.shortBreak);
        this.setActiveTab(1);
      }
    } else {
      this.currentMode = 'work';
      this.timeLeft.set(this.currentTechnique.workTime);
      this.setActiveTab(0);
    }
  }

  changeTechnique(event: Event): void {
    const selectedId = parseInt((event.target as HTMLSelectElement).value, 10);
    if (isNaN(selectedId)) {
        console.error("Invalid technique ID selected. No technique set.");
        this.currentTechnique = null;
        this.timeLeft.set(0);
        this.updateTimerDisplay();
        this.updateProgressCircle();
        return;
    }

    const selectedTechnique = this.techniqueService.getTechniqueById(selectedId);
    if (!selectedTechnique) {
        console.error(`Technique with ID ${selectedId} not found. No technique set.`);
        this.currentTechnique = null; // Deseleccionar si la técnica no se encuentra
        this.timeLeft.set(0);
        this.updateTimerDisplay();
        this.updateProgressCircle();
        return;
    }

    this.currentTechnique = selectedTechnique;
    
    console.log('Selected Technique Object:', this.currentTechnique);
    console.log('Techniques Map:', this.techniqueService.techniquesMap()); 

    this.currentMode = 'work';
    this.timeLeft.set(this.currentTechnique.workTime);
    this.updateTimerDisplay();
    this.updateProgressCircle();

    if (this.tabButtons && this.tabButtons.nativeElement) {
        const tabButtonsArray = Array.from(this.tabButtons.nativeElement);
        this.renderer.setProperty(tabButtonsArray[0], 'textContent', 'Sesión de concentración');
        this.renderer.setProperty(tabButtonsArray[1], 'textContent', 'Descanso Corto');
        if (tabButtonsArray.length > 2) {
            if (this.currentTechnique.longBreak > 0) {
                this.renderer.setStyle(tabButtonsArray[2], 'display', 'block');
                this.renderer.setProperty(tabButtonsArray[2], 'textContent', 'Descanso Largo');
            } else {
                this.renderer.setStyle(tabButtonsArray[2], 'display', 'none');
            }
        }
    }
    this.resetTimer();
    this.pomodoroCount = 0;
  }

  showNewTechniqueModal(): void {
    this.isNewTechniqueModalVisible.set(true);
    this.newTechniqueForm.reset(); // Asegurarse de que el formulario esté limpio
    this.newTechniqueForm.markAsPristine();
    this.newTechniqueForm.markAsUntouched();
  }

  hideNewTechniqueModal(): void {
    this.isNewTechniqueModalVisible.set(false);
    this.newTechniqueForm.reset();
  }

  saveNewTechnique(): void {
    if (this.newTechniqueForm.valid) {
      const newTechniqueFormData = this.newTechniqueForm.value;
      const techniqueToCreate: Omit<Technique, 'id'> = {
        name: newTechniqueFormData.name,
        workTime: newTechniqueFormData.workDuration, // Enviar a segundos
        shortBreak: newTechniqueFormData.shortBreak, // Enviar a segundos
        longBreak: newTechniqueFormData.longBreak, // Enviar a segundos
      };

      this.techniqueService.addTechnique(techniqueToCreate).subscribe({
        next: (createdTechnique) => {
          this.currentTechnique = createdTechnique; // Establece la técnica recién creada con su ID

          // Vuelve a renderizar las opciones para incluir la nueva técnica
          this.renderTechniqueOptions(); 
          
          // Seleccionar la nueva técnica en el dropdown por su ID
          if (createdTechnique.id) {
            this.renderer.setProperty(this.techniqueSelect.nativeElement, 'value', createdTechnique.id.toString());
          }
          
          // Actualizar UI y reiniciar
          this.changeTechnique({ target: this.techniqueSelect.nativeElement } as any); // Simula el evento de cambio
          this.setActiveTab(0);
          this.isNewTechniqueModalVisible.set(false);
          alert(`Técnica "${createdTechnique.name}" creada con éxito.`);
        },
        error: (err) => {
          console.error('Error al crear técnica', err);
          alert('Error al guardar la técnica. Intenta de nuevo.');
        }
      });
    } else {
      alert('Por favor, completa todos los campos requeridos correctamente.');
      this.newTechniqueForm.markAllAsTouched(); // Para mostrar errores de validación
    }
  }

  // --- Métodos para el temporizador flotante, tareas, etc. (sin cambios funcionales importantes) ---
  toggleFloatingTimer(): void { this.isFloatingTimerVisible = !this.isFloatingTimerVisible; }
  playNotificationSound(): void { console.log('¡Tiempo terminado!'); }
  startFloatingTimer(): void { this.startTimer(); }
  stopFloatingTimer(): void { this.stopTimer(); }
  resetFloatingTimer(): void { this.resetTimer(); }
  hideFloatingTimer(): void { this.isFloatingTimerVisible = false; }

  showSelectTaskModal(): void {
    this.isSelectTaskModalVisible.set(true);
    this.selectedTasksInModal = [];
  }

  hideSelectTaskModal(): void {
    this.isSelectTaskModalVisible.set(false);
    this.selectedTasksInModal = [];
  }

  isSelectedTask(taskId: number): boolean { return this.selectedTasksInModal.some(task => task.id === taskId); }

  toggleTaskSelection(task: Task): void {
    const index = this.selectedTasksInModal.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.selectedTasksInModal.splice(index, 1);
    } else {
      if (!this.associatedTasks().some(at => at.id === task.id)) {
        this.selectedTasksInModal.push(task);
      }
    }
  }

  addSelectedTasks(): void {
    const newAssociated = this.selectedTasksInModal.filter(selectedTask =>
      !this.associatedTasks().some(associatedTask => associatedTask.id === selectedTask.id)
    );
    this.associatedTasks.update(currentTasks => [...currentTasks, ...newAssociated]);
    this.hideSelectTaskModal();
    this.selectedTasksInModal = [];
  }

  toggleAssociatedTaskCompletion(task: Task): void {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.taskService.toggleComplete(task).subscribe({
      next: (updatedTask) => { console.log('Tarea actualizada a completada/pendiente:', updatedTask); },
      error: (err) => { console.error('Error al cambiar el estado de la tarea:', err); alert('No se pudo cambiar el estado de la tarea.'); }
    });
  }

  removeAssociatedTask(taskId: number): void {
    this.associatedTasks.update(currentTasks => currentTasks.filter(task => task.id !== taskId));
  }

  getTasksWithDueDateForDate(date: any): any[] { return []; }
}