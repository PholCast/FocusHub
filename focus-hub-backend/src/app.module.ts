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
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MyLogger } from './logger.service';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'mysql-db',
      port: 3306,
      username: 'testuser',
      password: 'testuser123',
      database: 'focus_hub_database',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
    UsersModule,
    MediaModule,
    CategoriesModule,
    EventsModule,
    RemindersModule,
    ProductivityModule,
    TasksModule,
    AuthModule
    ],
  controllers: [AppController],
  providers: [AppService,MyLogger],
})
export class AppModule {}
