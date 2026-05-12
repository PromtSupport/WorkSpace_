export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type Importance = 'low' | 'medium' | 'high';

export interface Account {
  id?: string;
  title: string;
  login: string;
  password?: string;
  serviceUrl?: string;
  notes?: string;
  createdAt: any;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  importance: Importance;
  deadline?: any;
  createdAt: any;
  creatorId: string;
  assigneeId?: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start: any;
  end: any;
  location?: string;
  createdAt: any;
}

export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any;
}
