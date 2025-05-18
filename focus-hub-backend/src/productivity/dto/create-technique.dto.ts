import { IsNotEmpty, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateTechniqueDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(1)
  workDuration: number;

  @IsInt()
  @Min(1)
  breakDuration: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  longBreakDuration?: number;

  @IsOptional()
  @MaxLength(500)
  description?: string;
}