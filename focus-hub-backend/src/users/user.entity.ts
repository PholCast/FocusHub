import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AmbientSound } from '../media/ambient-sound.entity';
import { Category } from 'src/categories/category.entity';
import { Event } from '../events/event.entity';
import { Technique } from 'src/productivity/entities/technique.entity';
import { FocusSession } from 'src/productivity/entities/focus-session.entity';
import { Task } from 'src/tasks/task.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true, nullable: false })
  email: string;

  @Column({ length: 255, nullable: false })
  password: string;

  @Column({
    type: 'enum',
    enum: ['light', 'dark'],
    default: 'light',
  })
  themePreference: 'light' | 'dark';

  @Column({ default: true })
  soundEnabled: boolean;

  @Column({ length: 45, nullable: false })
  name: string;

  @Column({ length: 45, nullable: true })
  lastname: string;

  @ManyToOne(() => AmbientSound, (sound) => sound.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sound_preference' })
  soundPreference: AmbientSound;

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => Event, (event) => event.user) // Relación de 1 a muchos
  events: Event[];

   // Relación OneToMany con Technique
  @OneToMany(() => Technique, (technique) => technique.user, { nullable: true, cascade: true })
  techniques?: Technique[];

  @OneToMany(() => FocusSession, (focusSession) => focusSession.user)
  focusSessions: FocusSession[];

   @OneToMany(() => Task, (task) => task.user, { cascade: true })
  tasks: Task[];
}
