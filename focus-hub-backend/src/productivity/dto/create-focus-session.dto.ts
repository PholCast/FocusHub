import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFocusSessionDto {
  @ApiProperty({ description: 'ID of the user', example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'ID of the technique', example: 1 })
  @IsInt()
  @IsNotEmpty()
  techniqueId: number;

  @ApiProperty({ description: 'Status of the focus session', enum: ['in_progress', 'paused', 'completed'], default: 'in_progress' })
  @IsEnum(['in_progress', 'paused', 'completed'])
  status: 'in_progress' | 'paused' | 'completed' = 'in_progress';
}
