import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFocusSessionDto {
  @ApiProperty({
    description: 'New status of the focus session',
    enum: ['in_progress', 'paused', 'completed'],
  })
  @IsEnum(['in_progress', 'paused', 'completed'])
  status: 'in_progress' | 'paused' | 'completed';
}
