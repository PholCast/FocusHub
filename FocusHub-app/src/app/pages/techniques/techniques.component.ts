import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Renderer2, inject,signal, WritableSignal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { Technique } from '../../shared/interfaces/technique.interface';
import { TechniqueService } from '../../services/technique.service'; // ajusta la ruta si es diferente
import { Task } from '../../shared/interfaces/task.interface'; // Tu interfaz Task
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-techniques',
  standalone: true,
  imports: [CommonModule, NavComponent,FormsModule, ReactiveFormsModule],
  templateUrl: './techniques.component.html',
  styleUrls: ['./techniques.component.css']
})
export class TechniquesComponent implements OnInit, OnDestroy, AfterViewInit {
  techniqueService = inject(TechniqueService);
  taskService = inject(TaskService);

  currentTechnique: Technique = {
    name: 'Pomodoro',
    workTime: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  currentMode: 'work' | 'shortBreak' | 'longBreak' = 'work';

  timerIntervalSubscription: Subscription | null = null;
  isRunning: boolean = false;
  pomodoroCount: number = 0;

  isFloatingTimerVisible: boolean = false;

  isNewTechniqueModalVisible = signal(false);
  activeTabIndex = signal(0);
  timeLeft = signal(this.currentTechnique.workTime); 


   // --- NUEVAS PROPIEDADES PARA GESTIONAR TAREAS ASOCIADAS ---
  isSelectTaskModalVisible = signal(false);

  // Usa directamente la signal `pendingTasks` de TaskService
  // Esta será la fuente de todas las tareas *disponibles* para asociar
  // También podríamos usar `tasks` si quisiéramos completadas o expiradas, pero el requisito es "pendientes".
  public readonly availableTasks = this.taskService.pendingTasks; // <-- ¡AQUÍ ESTÁ EL CAMBIO CLAVE!

  // Esta es la nueva señal computada que filtrará las tareas disponibles para el modal
  public readonly tasksForModalSelection = computed(() => {
      const allPending = this.availableTasks(); // Obtiene todas las tareas pendientes del servicio
      const associated = this.associatedTasks(); // Obtiene las tareas ya asociadas

      // Filtra las tareas pendientes, excluyendo aquellas que ya están en 'associatedTasks'
      return allPending.filter(pendingTask =>
          !associated.some(associatedTask => associatedTask.id === pendingTask.id)
      );
  });

  associatedTasks: WritableSignal<Task[]> = signal([]); // Las tareas que se mostrarán en la sección "Tareas Asociadas"
  selectedTasksInModal: Task[] = []; // Tareas seleccionadas temporalmente en el modal


  fb = inject(FormBuilder);

  newTechniqueForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    workDuration: [null, [Validators.required, Validators.min(1), Validators.max(120)]],
    shortBreak: [null, [Validators.required, Validators.min(1), Validators.max(30)]],
    longBreak: [0, [Validators.min(0), Validators.max(60)]],
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
    // SUSCRIBCIONES EXPLICITAS 

    this.taskService.loadTasks();

    console.log("TAREAS PENDIENTES DEL USUARIO", this.availableTasks());


    this.techniqueService.fetchTechniques().subscribe(() => {
      this.renderTechniqueOptions();
    });
    // ✅ Este efecto se ejecuta en cada cambio del signal, pero también necesita subscribirse
    effect(() => {
      this.techniqueService.fetchTechniques().subscribe(); 
    });
  }

  ngOnInit(): void {

    this.taskService.loadTasks();
    
    this.techniqueService.fetchTechniques().subscribe(() => {
      this.renderTechniqueOptions();
    });
  }

  renderTechniqueOptions(): void {
    const selectElement = this.techniqueSelect.nativeElement;

    // 1. Borrar todas las opciones existentes del <select>.
    // Esto asegura que la lista se reconstruya completamente cada vez
    // que se actualizan las técnicas desde el servicio.
    while (selectElement.options.length > 0) {
      this.renderer.removeChild(selectElement, selectElement.options[0]);
    }

    // 2. Obtener las técnicas del servicio.
    const techniques = this.techniqueService.techniquesMap();

    // 3. Añadir cada técnica como una nueva opción al <select>.
    for (const key in techniques) {
      if (Object.prototype.hasOwnProperty.call(techniques, key)) {
        const technique = techniques[key];
        const option = this.renderer.createElement('option');
        this.renderer.setProperty(option, 'value', key); // Ejemplo: 'pomodoro'
        this.renderer.setProperty(option, 'textContent', technique.name); // Ejemplo: 'Pomodoro'
        this.renderer.appendChild(selectElement, option);
      }
    }

    // 4. Seleccionar la técnica "Pomodoro" por defecto o la primera disponible.
    const pomodoroKey = 'pomodoro'; // La clave esperada para la técnica Pomodoro

    if (techniques[pomodoroKey]) {
      // Si la técnica Pomodoro existe en las técnicas cargadas, la establecemos como la actual
      // y la seleccionamos en el dropdown.
      this.currentTechnique = techniques[pomodoroKey];
      this.renderer.setProperty(selectElement, 'value', pomodoroKey);
    } else if (selectElement.options.length > 0) {
      // Si Pomodoro no está disponible (lo cual idealmente no debería pasar si tu servicio la gestiona),
      // seleccionamos la primera técnica de la lista.
      selectElement.selectedIndex = 0;
      const selectedKey = selectElement.options[selectElement.selectedIndex].value;
      this.currentTechnique = this.techniqueService.techniquesMap()[selectedKey];
    } else {
      // Si no hay ninguna técnica cargada (por ejemplo, si el servicio devuelve una lista vacía),
      // mantenemos la definición inicial de Pomodoro como un último recurso.
      this.currentTechnique = {
        name: 'Pomodoro',
        workTime: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
      };
      // No se puede seleccionar en el <select> si no hay opciones, pero al menos el componente tiene un estado.
    }

    // 5. Actualizar la interfaz de usuario con la técnica seleccionada.
    this.timeLeft.set(this.currentTechnique.workTime);
    this.updateTimerDisplay();
    this.updateProgressCircle();
    this.setActiveTab(0); // Esto asegura que la pestaña de "Trabajo" esté activa.
  }


  ngAfterViewInit(): void {
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
    if (this.currentMode === 'work') {
      totalTime = this.currentTechnique.workTime;
    } else if (this.currentMode === 'shortBreak') {
      totalTime = this.currentTechnique.shortBreak;
    } else {
      totalTime = this.currentTechnique.longBreak;
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
    if (this.currentMode === 'work') {
      this.pomodoroCount++;
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
    this.techniqueService.fetchTechniques().subscribe(() => {
      const selectedValue = (event.target as HTMLSelectElement).value.replace(/-/g, ' ').trim();

      // ahora para obtener el texto :

      const selectedText = (event.target as HTMLSelectElement).options[
        (event.target as HTMLSelectElement).selectedIndex
      ].textContent;

      // IMPORTANT: Re-format the textContent to match the keys in your techniquesMap
      // Assuming your map keys are lowercase and spaces/special chars are replaced with hyphens
      if (!selectedText) { // Add a check for null/undefined textContent
        console.error("No text content found for selected option.");
        return;
      }
      this.currentTechnique = this.techniqueService.techniquesMap()[selectedText];
      console.log('selectedValue:', selectedValue);
      console.log('selectedText:', selectedText);
      console.log('techniquesMap:', this.techniqueService.techniquesMap()); 
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
    });
  }

  showNewTechniqueModal(): void {
    this.isNewTechniqueModalVisible.set(true);
  }

  hideNewTechniqueModal(): void {
    this.isNewTechniqueModalVisible.set(false);
    this.newTechniqueForm.reset();
  }

  saveNewTechnique(): void {
    if (this.newTechniqueForm.valid) {
      const newTechnique = this.newTechniqueForm.value;
      const technique: Technique = {
        name: newTechnique.name,
        workTime: newTechnique.workDuration * 60,
        shortBreak: newTechnique.shortBreak * 60,
        longBreak: newTechnique.longBreak * 60,
      };

      this.techniqueService.addTechnique(technique).subscribe({
        next: (createdTechnique) => {
          // Actualizar select
          const techniqueId = createdTechnique.name.toLowerCase().replace(/\s+/g, '-');
          const option = this.renderer.createElement('option');
          this.renderer.setProperty(option, 'value', techniqueId);
          this.renderer.setProperty(option, 'textContent', createdTechnique.name);
          this.renderer.appendChild(this.techniqueSelect.nativeElement, option);

          // Seleccionar nuevo valor
          this.renderer.setProperty(this.techniqueSelect.nativeElement, 'value', techniqueId);

          // Actualizar UI
          setTimeout(() => {
            this.changeTechnique({ target: this.techniqueSelect.nativeElement } as any);
            this.setActiveTab(0);
          }, 0);

          this.isNewTechniqueModalVisible.set(false);
          this.setActiveTab(0);
          this.newTechniqueForm.reset();

          alert(`Técnica "${createdTechnique.name}" creada con éxito.`);
        },
        error: (err) => {
          console.error('Error al crear técnica', err);
          alert('Error al guardar la técnica. Intenta de nuevo.');
        }
      });

    } else {
      alert('Por favor, completa todos los campos requeridos correctamente.');
    }
  }

  toggleFloatingTimer(): void {
    this.isFloatingTimerVisible = !this.isFloatingTimerVisible;
  }

  playNotificationSound(): void {
    console.log('¡Tiempo terminado!');

  }

  startFloatingTimer(): void {
    this.startTimer();
  }

  stopFloatingTimer(): void {
    this.stopTimer();
  }

  resetFloatingTimer(): void {
    this.resetTimer();
  }

  hideFloatingTimer(): void {
    this.isFloatingTimerVisible = false;
  }

  // --- NUEVAS FUNCIONES PARA GESTIONAR TAREAS (AJUSTADAS PARA SIGNALS) ---

  // Muestra el modal para seleccionar tareas
  showSelectTaskModal(): void {
    this.isSelectTaskModalVisible.set(true);
    // Reinicia la selección temporal cada vez que se abre el modal
    this.selectedTasksInModal = [];
    // Las tareas disponibles (`availableTasks()`) ya son las pendientes,
    // pero debemos filtrarlas para que no incluyan las que ya están asociadas.
    // No es necesario reasignar `allUserTasks` porque `availableTasks` es un computed de `TaskService`.
    // Simplemente usamos el getter `availableTasks()` y filtramos en `toggleTaskSelection` y `addSelectedTasks`.
  }

  // Oculta el modal de selección de tareas
  hideSelectTaskModal(): void {
    this.isSelectTaskModalVisible.set(false);
    this.selectedTasksInModal = []; // Limpia la selección al cerrar
  }

  // Verifica si una tarea está seleccionada temporalmente en el modal
  isSelectedTask(taskId: number): boolean {
    return this.selectedTasksInModal.some(task => task.id === taskId);
  }

  // Agrega o quita una tarea de la selección temporal en el modal
  toggleTaskSelection(task: Task): void {
    const index = this.selectedTasksInModal.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.selectedTasksInModal.splice(index, 1); // Quita la tarea si ya estaba seleccionada
    } else {
      // Solo agrega si la tarea no está ya en la lista de asociadas
      if (!this.associatedTasks().some(at => at.id === task.id)) {
        this.selectedTasksInModal.push(task);
      }

      console.log("revisando cuales ya están asociadas:",this.associatedTasks())
      console.log("selectedTasksInModal",  this.selectedTasksInModal)
    }
  }

  // Añade las tareas seleccionadas del modal a la lista de tareas asociadas
  addSelectedTasks(): void {
    // Filtra las tareas seleccionadas para asegurar que no se dupliquen en `associatedTasks`
    const newAssociated = this.selectedTasksInModal.filter(selectedTask =>
      !this.associatedTasks().some(associatedTask => associatedTask.id === selectedTask.id)
    );

    this.associatedTasks.update(currentTasks => [...currentTasks, ...newAssociated]);

    this.hideSelectTaskModal();
    // Limpia la selección temporal para la próxima vez que se abra el modal
    this.selectedTasksInModal = [];
  }

  // Permite al usuario marcar una tarea asociada como completada
  toggleAssociatedTaskCompletion(task: Task): void {
      // Determina el nuevo estado basado en el estado actual
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';

      // Opcional: Actualiza la tarea en el TaskService.
      // Esto llamará al endpoint /tasks/:id/status que tienes en tu TaskService.
      // El TaskService ya se encarga de actualizar su propia signal `tasks`.
      this.taskService.toggleComplete(task); // Esto ya cambia el status y llama al backend.

      // Si no usaras toggleComplete del servicio, harías algo como esto:
      // task.status = newStatus; // Actualiza el estado localmente (si no usas una copia)
      // this.taskService.updateTask(task).subscribe({ // Llama al servicio para guardar el cambio
      //   next: () => console.log('Tarea actualizada con éxito'),
      //   error: (err) => console.error('Error al actualizar tarea:', err)
      // });

      console.log(`Tarea ${task.title} cambiada a estado: ${newStatus}`);

      // Si quieres que las tareas completadas se quiten de la lista de asociadas
      // automáticamente, puedes refiltrar `associatedTasks` o simplemente
      // confiar en que el usuario la desvinculará si ya está terminada.
      // Para este caso, dado que el checkbox es para "marcar como completada",
      // la dejaremos en la lista de asociadas a menos que el usuario la remueva
      // con el botón 'x'.
    }

  // Permite al usuario desvincular una tarea de la lista de asociadas (sin borrarla del sistema)
  removeAssociatedTask(taskId: number): void {
    this.associatedTasks.update(currentTasks => currentTasks.filter(task => task.id !== taskId));
    // No necesitas llamar a `loadUserTasks` aquí, ya que `availableTasks` es un signal `computed`
    // que se actualizará automáticamente cuando cambie `taskService.tasks`.
  }

  // Este método es para la sección de "week-tasks-container" que no era el foco principal,
  // pero lo mantengo por si lo necesitas:
  getTasksWithDueDateForDate(date: any): any[] {
    // Si tus tareas tienen `dueDate` y quieres filtrarlas por día,
    // tendrías que acceder a `this.taskService.tasks()` y filtrarlas.
    // Por ejemplo:
    /*
    const targetDate = new Date(date).setHours(0, 0, 0, 0);
    return this.taskService.tasks().filter(task => {
      if (!task.dueDate) return false;
      const taskDueDate = new Date(task.dueDate).setHours(0, 0, 0, 0);
      return taskDueDate === targetDate;
    });
    */
    return []; // Deja como un array vacío si no lo usas aquí.
  }
}