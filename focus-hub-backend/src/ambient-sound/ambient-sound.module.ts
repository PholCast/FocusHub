import { Module} from '@nestjs/common';
import { AmbientSoundService } from './ambient-sound.service';
import { AmbientSoundController } from './ambient-sound.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbientSound } from './ambient-sound.entity';
import { User } from 'src/users/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AmbientSound])  
  ],
  providers: [AmbientSoundService],
  controllers: [AmbientSoundController],
  exports: [AmbientSoundService],
})
export class AmbientSoundModule {}
