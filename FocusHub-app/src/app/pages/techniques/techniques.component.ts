import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Renderer2, inject,signal, WritableSignal } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { Technique } from '../../shared/interfaces/technique.interface';

@Component({
  selector: 'app-techniques',
  standalone: true,
  imports: [NavComponent,FormsModule, ReactiveFormsModule],
  templateUrl: './techniques.component.html',
  styleUrls: ['./techniques.component.css']
})
export class TechniquesComponent implements OnInit, OnDestroy, AfterViewInit {
  techniques: { [key: string]: Technique } = {
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
    },
  };

  currentTechnique: Technique = this.techniques['pomodoro'];
  currentMode: 'work' | 'shortBreak' | 'longBreak' = 'work';

  timerIntervalSubscription: Subscription | null = null;
  isRunning: boolean = false;
  pomodoroCount: number = 0;


  isFloatingTimerVisible: boolean = false;

  isNewTechniqueModalVisible = signal(false);
  activeTabIndex = signal(0);
  timeLeft = signal(this.currentTechnique.workTime);


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

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void { }

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
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.currentTechnique = this.techniques[selectedValue];
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
  }

  hideNewTechniqueModal(): void {
    this.isNewTechniqueModalVisible.set(false);
    this.newTechniqueForm.reset();
  }

  saveNewTechnique(): void {
    if (this.newTechniqueForm.valid) {
      const newTechnique = this.newTechniqueForm.value;
      const techniqueId = newTechnique.name.toLowerCase().replace(/\s+/g, '-');

      this.techniques[techniqueId] = {
        name: newTechnique.name,
        workTime: newTechnique.workDuration * 60,
        shortBreak: newTechnique.shortBreak * 60,
        longBreak: newTechnique.longBreak * 60,
      };

      const option = this.renderer.createElement('option');
      this.renderer.setProperty(option, 'value', techniqueId);
      this.renderer.setProperty(option, 'textContent', newTechnique.name);
      this.renderer.appendChild(this.techniqueSelect.nativeElement, option);

      this.renderer.setProperty(this.techniqueSelect.nativeElement, 'value', techniqueId);


      setTimeout(() => {
        this.changeTechnique({ target: this.techniqueSelect.nativeElement } as any);
       this.setActiveTab(0);
      }, 0);

      this.isNewTechniqueModalVisible.set(false);
      this.setActiveTab(0);
      this.newTechniqueForm.reset();

      alert(`Técnica "${newTechnique.name}" creada con éxito.`);
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
}