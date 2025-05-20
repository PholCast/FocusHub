import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Event } from '../../events/event.entity';

@Entity('event_reminders')
export class EventReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime', nullable: false })
  reminderTime: Date;

  @Column({
    type: 'enum',
    enum: ['push', 'desktop'],
    default: 'push',
    nullable: false,
  })
  notificationType: 'push' | 'desktop';

  @Column({ type: 'tinyint', default: 1, nullable: false })
  status: boolean;


  @OneToOne(() => Event, (event) => event.reminder)
  @JoinColumn({ name: 'events_id' })
  event: Event;
}
