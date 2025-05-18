import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Column } from 'typeorm';
import { FocusSession } from './focus-session.entity';
import { Task } from '../../tasks/task.entity';

@Entity('focus_session_tasks')
@Index('focus_session_id_task_id', ['focusSession', 'task'], { unique: true })
export class FocusSessionTask {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FocusSession, (focusSession) => focusSession.focusSessionTasks, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'focus_session_id' })
  focusSession: FocusSession;

  @ManyToOne(() => Task, (task) => task.focusSessionTasks, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

}
