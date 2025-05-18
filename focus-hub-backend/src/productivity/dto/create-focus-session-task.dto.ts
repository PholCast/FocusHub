import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFocusSessionTaskDto {
  @ApiProperty({ description: 'ID of the focus session', example: 1 })
  @IsInt()
  @IsNotEmpty()
  focusSessionId: number;

  @ApiProperty({ description: 'ID of the task', example: 2 })
  @IsInt()
  @IsNotEmpty()
  taskId: number;
}
