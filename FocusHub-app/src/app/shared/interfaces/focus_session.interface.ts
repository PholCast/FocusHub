export interface FocusSession {
  id: number;
  userId?: number; 
  techniqueId: number; 
  status: 'in_progress' | 'paused' | 'completed';
}