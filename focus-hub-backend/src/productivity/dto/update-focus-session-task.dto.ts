import { PartialType } from '@nestjs/swagger';
import { CreateFocusSessionTaskDto } from './create-focus-session-task.dto';

export class UpdateFocusSessionTaskDto extends PartialType(CreateFocusSessionTaskDto) {}
