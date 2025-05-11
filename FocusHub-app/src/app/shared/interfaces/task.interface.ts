export interface Task {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
    createdDate: string;
    dueDate?: string;
    priority?: 'Baja' | 'Media' | 'Alta';
    category?: string;
    project?: string;
}