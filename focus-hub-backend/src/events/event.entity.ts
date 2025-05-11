import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { EventReminder } from 'src/reminders/entities/event-reminder.entity';


@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true, default: null })
  description?: string;

  @Column({ type: 'datetime', nullable: false })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, default: null })
  endTime?: Date;

  // @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  // createdAt: Date;
   // 🔄 Simplificación para el campo createdAt
  @CreateDateColumn()
  createdAt: Date;
  
  @ManyToOne(() => User, (user) => user.events, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.events, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  // Relación uno a uno con EventReminder
  @OneToOne(() => EventReminder, (eventReminder) => eventReminder.event, { nullable: true })
  reminder: EventReminder;
}
