import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import {Event} from '../events/event.entity'
import { Task } from 'src/tasks/task.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, nullable: false, unique: true })
  name: string;




  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.categories, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Event, (event) => event.category)
  events: Event[];

  @OneToMany(() => Task, (task) => task.category, { cascade: true, nullable: true })
  tasks?: Task[];
}
