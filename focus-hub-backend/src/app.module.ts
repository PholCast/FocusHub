import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TechniquesModule } from './techniques/techniques.module';

@Module({
  imports: [UsersModule, TechniquesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
