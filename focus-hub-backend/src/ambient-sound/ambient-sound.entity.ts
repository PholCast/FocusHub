import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';


@Entity('ambient_sounds')
export class AmbientSound {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column({ length: 255, nullable: false, unique: true })
  filePath: string;

  @OneToMany(() => User, (user) => user.soundPreference)
  users: User[];
  
}
