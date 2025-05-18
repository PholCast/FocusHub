import {IsString,IsNotEmpty,IsOptional,IsDateString,IsInt} from 'class-validator'

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsDateString()
  @IsNotEmpty()
  startTime: string // formato ISO 8601

  @IsOptional()
  @IsDateString()
  endTime?: string

  @IsInt()
  @IsNotEmpty()
  user_id: number

  @IsOptional()
  @IsInt()
  category_id?: number
}
