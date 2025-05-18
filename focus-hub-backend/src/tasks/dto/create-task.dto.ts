import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';

// Define type aliases for validation clarity (match entity string literals)
type TaskStatusString = 'pending' | 'in_progress' | 'completed' | 'overdue';
type TaskPriorityString = 'low' | 'medium' | 'high';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString() // Expects ISO 8601 string from frontend
  dueDate?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high']) // Validate against allowed string literals
  priority?: TaskPriorityString;

  @IsOptional() // Status can be provided, or backend default 'pending' is used
  @IsEnum(['pending', 'in_progress', 'completed', 'overdue']) // Validate against allowed string literals
  status?: TaskStatusString;

  @IsNotEmpty()
  @IsNumber()
  userId: number; // Assuming user ID is passed for now (requires auth in real app)

  @IsOptional()
  @IsNumber()
  categoryId?: number; // Expects category ID, not name string
}