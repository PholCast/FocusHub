import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany, OneToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { FocusSessionTask } from 'src/productivity/entities/focus-session-task.entity';
import { TaskReminder } from 'src/reminders/entities/task-reminder.entity';

@Entity('tasks')
@Index('user_id', ['user'])
@Index('category_id', ['category'])
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: 'low' | 'medium' | 'high';

  @Column({ type: 'enum', enum: ['pending', 'in_progress', 'completed', 'overdue'], default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';

  @ManyToOne(() => User, (user) => user.tasks, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  // @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  // createdAt: Date;

   // 🔄 Simplificación para el campo createdAt
  @CreateDateColumn()
  createdAt: Date;
  
  @OneToMany(() => FocusSessionTask, (focusSessionTask) => focusSessionTask.task, { cascade: true })
  focusSessionTasks: FocusSessionTask[];

  @OneToOne(() => TaskReminder, (taskReminder) => taskReminder.task, { cascade: true })
  taskReminder: TaskReminder;
}
