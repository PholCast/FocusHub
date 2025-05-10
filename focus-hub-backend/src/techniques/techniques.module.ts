import { Module } from '@nestjs/common';
import { TechniquesController } from './techniques.controller';
import { TechniquesService } from './techniques.service';

@Module({
  controllers: [TechniquesController],
  providers: [TechniquesService]
})
export class TechniquesModule {}
