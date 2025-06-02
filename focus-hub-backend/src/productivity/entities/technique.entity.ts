import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/user.entity';
import { FocusSession } from './focus-session.entity';

@Entity('techniques')
export class Technique {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  name: string;

  @Column({ type: 'int', nullable: false })
  workTime: number;

  @Column({ type: 'int', nullable: false })
  shortBreak: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  longBreak?: number;

  @ManyToOne(() => User, (user) => user.techniques, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => FocusSession, (focusSession) => focusSession.technique)
  focusSessions: FocusSession[];
}