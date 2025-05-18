export interface Task {
    id: number; 
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'Baja' | 'Media' | 'Alta';
    status: boolean;
    createdAt: string;
    user_id: number | null;
    category?: string;
    project?: string;
}
