import { IsString, IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';

// Define type aliases for validation clarity (match entity string literals)
type TaskStatusString = 'pending' | 'in_progress' | 'completed' | 'overdue';
type TaskPriorityString = 'low' | 'medium' | 'high';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString() // Expects ISO 8601 string from frontend
  dueDate?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high']) // Validate against allowed string literals
  priority?: TaskPriorityString;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'overdue']) // Validate against allowed string literals
  status?: TaskStatusString; // Status can be updated

  @IsOptional()
  @IsNumber()
  userId?: number; // Should ideally not be updated via task endpoint, but included in DTO/check

  @IsOptional()
  @IsNumber()
  categoryId?: number | null; // Allow setting category to null
}