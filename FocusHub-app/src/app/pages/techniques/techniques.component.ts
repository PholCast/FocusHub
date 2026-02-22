import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Renderer2, inject,signal, WritableSignal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { Technique } from '../../shared/interfaces/technique.interface';
import { Task } from '../../shared/interfaces/task.interface';
import { TechniqueService } from '../../services/technique.service';
import { TaskService } from '../../services/task.service';
import { TokenService } from '../../services/token.service';

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
  tokenService = inject(TokenService);

  currentTechnique: Technique = {
    name: '',
    workTime: 0,
    shortBreak: 0,
    longBreak: 0,
  };

  currentMode: 'work' | 'shortBreak' | 'longBreak' = 'work';

  timerIntervalSubscription: Subscription | null = null;
  isRunning: boolean = false;
  pomodoroCount: number = 0;

  isFloatingTimerVisible: boolean = false;

  isNewTechniqueModalVisible = signal(false);
  activeTabIndex = signal(0);
  timeLeft = signal(this.currentTechnique.workTime);
  sessionTasks = signal<Task[]>([]);
  focusSessionStatus: 'in_progress' | 'paused' | 'completed' | null = null;

  fb = inject(FormBuilder);

  get techniques(): Technique[] {
    return this.techniqueService.techniques();
  }

  get pendingTasks() {
    return this.taskService.pendingTasks();
  }

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
    this.taskService.loadTasks(); // Load tasks on init
    this.techniqueService.fetchTechniques().subscribe(() => {
      const list = this.techniqueService.techniques();
      if (list && list.length > 0) {
        // Try to find 'Pomodoro' or use the first technique
        const pomodoro = list.find(t => t.name.toLowerCase().includes('pomodoro'));
        this.currentTechnique = pomodoro || list[0];
        this.timeLeft.set(this.currentTechnique.workTime);
        this.updateTimerDisplay();
        this.updateProgressCircle();
      }
    });
  }

  ngOnInit(): void {
    // Initialization is handled in constructor
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
    // Only create or resume a focus session when in 'work' mode
    if (this.currentMode !== 'work') {
      // For breaks, just start the timer interval without creating sessions
      this.startTimerInterval();
      return;
    }

    // Work mode: if no session exists, create one
    if (!this.techniqueService.currentFocusSessionId()) {
      const tokenData = this.tokenService.decodeToken();
      const userId = tokenData?.sub;
      const techniqueId = (this.currentTechnique as any).id || 1; // fallback to 1 if no id

      if (!userId) {
        console.error('No userId found');
        this.isRunning = false;
        return;
      }

      this.techniqueService.createFocusSession(userId, techniqueId).subscribe({
        next: (session) => {
          console.log('Session created, starting timer', session);

          // If there were tasks added locally before the session was created,
          // persist those relations in the backend now.
          const localSessionTasks = this.sessionTasks();
          if (localSessionTasks && localSessionTasks.length > 0 && session && session.id) {
            console.log('Linking pre-added tasks to new session:', session.id, localSessionTasks.map(t => t.id));
            localSessionTasks.forEach(t => {
              this.techniqueService.addTaskToFocusSession(session.id, t.id).subscribe({
                next: () => console.log(`Linked task ${t.id} to session ${session.id}`),
                error: (err) => console.error(`Error linking task ${t.id} to session ${session.id}:`, err)
              });
            });
          }

          this.startTimerInterval();
        },
        error: (err) => {
          console.error('Error creating focus session:', err);
          this.isRunning = false;
        }
      });
    } else {
      // Session exists, resume it
      const sessionId = this.techniqueService.currentFocusSessionId();
      if (sessionId) {
        this.techniqueService.updateFocusSessionStatus(sessionId, 'in_progress').subscribe({
          next: () => {
            this.focusSessionStatus = 'in_progress';
            this.startTimerInterval();
          },
          error: (err) => {
            console.error('Error updating session status:', err);
            this.isRunning = false;
          }
        });
      }
    }
  }

  private startTimerInterval(): void {
    this.timerIntervalSubscription = interval(1000).subscribe(() => {
      if (this.timeLeft() > 0) {
        this.timeLeft.update(value => value - 1);
        this.updateTimerDisplay();
        this.updateProgressCircle();
      } else {
        // Timer expired - stop interval and mark session as complete
        if (this.timerIntervalSubscription) {
          this.timerIntervalSubscription.unsubscribe();
          this.timerIntervalSubscription = null;
        }
        this.isRunning = false;

        // Complete session first (PATCH status='completed')
        this.completeSession();

        // Then play sound and switch mode
        this.playNotificationSound();
        this.switchToNextMode();
      }
    });
  }

  private completeSession(): void {
    const sessionId = this.techniqueService.currentFocusSessionId();
    if (sessionId) {
      this.techniqueService.updateFocusSessionStatus(sessionId, 'completed').subscribe({
        next: () => {
          this.focusSessionStatus = 'completed';
          this.techniqueService.currentFocusSessionId.set(null);
          this.sessionTasks.set([]);
          console.log('Session completed');
        },
        error: (err) => console.error('Error completing session:', err)
      });
    }
  }

  stopTimer(): void {
    if (!this.isRunning) return;
    if (this.timerIntervalSubscription) {
      this.timerIntervalSubscription.unsubscribe();
      this.timerIntervalSubscription = null;
    }
    this.isRunning = false;

    // Pause the focus session
    const sessionId = this.techniqueService.currentFocusSessionId();
    if (sessionId) {
      this.techniqueService.updateFocusSessionStatus(sessionId, 'paused').subscribe({
        next: () => {
          this.focusSessionStatus = 'paused';
          console.log('Session paused');
        },
        error: (err) => console.error('Error pausing session:', err)
      });
    }
  }

  resetTimer(): void {
    // Complete the session on reset
    this.completeSession();

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
    // If switching to a break while a focus session exists, complete it first
    const sessionId = this.techniqueService.currentFocusSessionId();
    if (index !== 0 && sessionId) {
      console.log('Completing active session before switching to break:', sessionId);
      this.completeSession();
    }

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
    const selectedValue = (event.target as HTMLSelectElement).value;
    const technique = this.techniqueService.getTechnique(selectedValue);
    if (!technique) return;
    this.currentTechnique = technique;
    this.currentMode = 'work';
    this.timeLeft.set(this.currentTechnique.workTime);
    this.updateTimerDisplay();
    this.updateProgressCircle();
    this.resetTimer();
    this.pomodoroCount = 0;
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
          // Service updates signals; just set currentTechnique to created one
          this.currentTechnique = createdTechnique;
          this.currentMode = 'work';
          this.timeLeft.set(this.currentTechnique.workTime);
          this.updateTimerDisplay();
          this.updateProgressCircle();
          this.setActiveTab(0);
          this.isNewTechniqueModalVisible.set(false);
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

  toggleTaskComplete(task: Task): void {
    this.taskService.toggleComplete(task);
  }

  addTaskToSession(task: Task): void {
    // Do not allow adding tasks when not in work mode
    if (this.currentMode !== 'work') {
      console.warn('Cannot add tasks during break mode:', this.currentMode);
      return;
    }
    const current = this.sessionTasks();
    const taskAlreadyInSession = current.find(t => t.id === task.id);

    console.log('🔵 addTaskToSession called for task:', task.title, 'ID:', task.id);
    console.log('   Task already in session?', !!taskAlreadyInSession);
    console.log('   Current session ID:', this.techniqueService.currentFocusSessionId());
    console.log('   Is running?', this.isRunning);

    if (!taskAlreadyInSession) {
      // Add to local state
      this.sessionTasks.set([...current, task]);
      console.log('✅ Task added to sessionTasks signal');

      // Add task to focus session in backend if session exists
      const sessionId = this.techniqueService.currentFocusSessionId();
      if (sessionId) {
        console.log('📤 Posting to addTaskToFocusSession with sessionId:', sessionId);
        this.techniqueService.addTaskToFocusSession(sessionId, task.id).subscribe({
          next: () => {
            console.log('✅ Task added to focus session on backend');
          },
          error: (err) => {
            console.error('❌ Error adding task to focus session:', err);
            // Remove from local state if failed
            this.removeTaskFromSession(task.id);
          }
        });
      } else {
        console.log('⚠️ No active session - task added locally only');
      }
    } else {
      console.log('⚠️ Task already in session');
    }
  }

  removeTaskFromSession(taskId: number): void {
    console.log('🔴 removeTaskFromSession called with taskId:', taskId);
    const sessionId = this.techniqueService.currentFocusSessionId();
    console.log('   Current session ID:', sessionId);

    // If session exists, delete from backend first
    if (sessionId) {
      console.log('📤 Posting DELETE to removeTaskFromFocusSession...');
      this.techniqueService.removeTaskFromFocusSession(sessionId, taskId).subscribe({
        next: () => {
          // Only remove from local state if API call succeeds
          console.log('✅ Task removed from backend, now removing from local state');
          const current = this.sessionTasks();
          this.sessionTasks.set(current.filter(t => t.id !== taskId));
        },
        error: (err) => {
          console.error('❌ Error removing task from focus session:', err);
        }
      });
    } else {
      // No session, just remove from local state
      console.log('⚠️ No active session, removing from local state only');
      const current = this.sessionTasks();
      this.sessionTasks.set(current.filter(t => t.id !== taskId));
    }
  }

  toggleSessionTaskComplete(task: Task): void {
    if (!this.isRunning) return; // Only allow if session is active
    // Toggle completion status via TaskService
    this.taskService.toggleComplete(task);

    // If the task was pending and user marked it completed, remove it from the
    // local sessionTasks list so it no longer appears in the session UI.
    if (task.status !== 'completed') {
      const current = this.sessionTasks();
      this.sessionTasks.set(current.filter(t => t.id !== task.id));
    }
  }

  isTaskInSession(taskId: number): boolean {
    return this.sessionTasks().some(t => t.id === taskId);
  }
}
