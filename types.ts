
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom' | '6months';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'pix';
export type TransactionClassification = 'fixed' | 'variable' | 'recurring';

export interface UserProfile {
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  profileImage?: string;
  address: {
    street: string;
    number: string;
    city: string;
    state: string;
    zip: string;
  };
  houseName: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  userEmail: string | null;
  lastLogin: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  responsible: string;
  dueDate: string;
  recurrence: RecurrenceType;
  status: TaskStatus;
  priority: PriorityLevel;
  alarmConfig?: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    triggered: boolean;
  };
  points: number;
  createdAt: string;
  medicationId?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  value: number;
  date: string;
  recurring: boolean;
  notes: string;
  paymentMethod: PaymentMethod;
  classification: TransactionClassification;
  linkedEventId?: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  person: string;
  dosage: string;
  frequency: string;
  stock: number;
  minStock: number;
  lastTaken?: string;
  isActive: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: 'market' | 'pharmacy' | 'maintenance' | 'other';
  listName?: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  autoRefill: boolean;
}

export interface Reminder {
  id: string;
  relatedModule: 'tasks' | 'finance' | 'health';
  relatedId: string;
  reminderDate: string;
  notified: boolean;
  title: string;
}

export interface TimelineEvent {
  id: string;
  eventType: 'task' | 'expense' | 'income' | 'reminder' | 'health';
  referenceId: string;
  title: string;
  description: string;
  date: string;
}

export interface HomeState {
  auth: AuthState;
  profile: UserProfile;
  tasks: Task[];
  finance: Transaction[];
  reminders: Reminder[];
  timeline: TimelineEvent[];
  medications: Medication[];
  shoppingList: ShoppingItem[];
  userPoints: number;
  theme: 'light' | 'dark';
}
