import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaModule } from './media/media.module';
import { CategoriesModule } from './categories/categories.module';
import { EventsModule } from './events/events.module';
import { RemindersModule } from './reminders/reminders.module';
import { ProductivityModule } from './productivity/productivity.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Micontrasena',
      database: 'focusHubDatabase',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Solo para desarrollo, no usar en producción
      logging: true,
    }),
    UsersModule,
    MediaModule,
    CategoriesModule,
    EventsModule,
    RemindersModule,
    ProductivityModule,
    TasksModule
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
