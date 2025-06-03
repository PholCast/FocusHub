import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Renderer2, inject,signal, WritableSignal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { Technique } from '../../shared/interfaces/technique.interface';
import { TechniqueService } from '../../services/technique.service'; // ajusta la ruta si es diferente

@Component({
  selector: 'app-techniques',
  standalone: true,
  imports: [CommonModule, NavComponent,FormsModule, ReactiveFormsModule],
  templateUrl: './techniques.component.html',
  styleUrls: ['./techniques.component.css']
})
export class TechniquesComponent implements OnInit, OnDestroy, AfterViewInit {
  techniqueService = inject(TechniqueService);

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
    // ✅ Se suscribe explícitamente
    this.techniqueService.fetchTechniques().subscribe(() => {
      this.renderTechniqueOptions();
    });
    // ✅ Este efecto se ejecuta en cada cambio del signal, pero también necesita subscribirse
    effect(() => {
      this.techniqueService.fetchTechniques().subscribe(); 
    });
  }

  ngOnInit(): void {
    // ✅ También con .subscribe
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
}