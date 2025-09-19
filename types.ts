export interface Task {
  id: number;
  text: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface Log {
  id: number;
  taskId?: number;
  timestamp: string;
  message: string;
  type: 'thought' | 'action' | 'system' | 'error' | 'success';
}
