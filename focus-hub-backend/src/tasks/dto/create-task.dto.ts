import { IsString, IsOptional, IsEnum, IsDate, IsNumber, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'The title of the task',
    example: 'Complete project documentation',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the task',
    example: 'Write comprehensive documentation for the API endpoints and data models',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The due date for the task',
    example: '2025-06-01T12:00:00.000Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({
    description: 'Priority level of the task',
    enum: ['low', 'medium', 'high'],
    example: 'medium',
    default: 'medium',
  })
  @IsEnum(['Alta', 'Media', 'Baja'])
  @IsOptional()
  priority?:'Low' | 'Medium' | 'High';

  @ApiProperty({
    description: 'Current status of the task',
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    example: 'pending',
    default: 'pending',
  })
  @IsEnum(['pending', 'in_progress', 'completed', 'overdue'])
  @IsOptional()
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue';

  @ApiProperty({
    description: 'ID of the category the task belongs to',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  categoryId?: number;
}