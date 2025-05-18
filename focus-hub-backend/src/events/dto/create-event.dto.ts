import {IsString,IsNotEmpty,IsOptional,IsDateString,IsInt} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Title of the event', example: 'Project Meeting' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Description of the event', example: 'Meeting to discuss project progress', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Start time of the event', example: '2025-06-01T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty({ description: 'End time of the event', example: '2025-06-01T12:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: Date;

  @ApiProperty({ description: 'User ID associated with the event', example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'Category ID associated with the event', example: 1, required: false })
  @IsInt()
  @IsOptional()
  categoryId?: number;
}

