
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom' | '6months';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'pix';
export type TransactionClassification = 'fixed' | 'variable' | 'recurring';
export type AlarmSoundType = 'gentle' | 'standard' | 'urgent';
export type VibrationIntensity = 'low' | 'medium' | 'high';
export type InvestmentType = 'stock' | 'crypto' | 'fund' | 'real_estate' | 'other';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalCategory = 'emergency_fund' | 'vacation' | 'car' | 'house' | 'other';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  eventType: 'task' | 'income' | 'expense' | 'reminder';
}

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
  alarmSettings: {
    soundType: AlarmSoundType;
    vibrationEnabled: boolean;
    vibrationIntensity: VibrationIntensity;
    notificationsEnabled: boolean;
  };
}

export interface AuthState {
  isLoggedIn: boolean;
  userEmail: string | null;
  userId: string | null;
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
    lastNotified?: string;
  };
  points: number;
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
  alarmConfig?: {
    enabled: boolean;
    times?: string[];
    nextDose?: string;
  };
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
  creditCardId?: string; // Reference to specific credit card
  classification: TransactionClassification;
  linkedEventId?: string;
  createdAt: string;
  isForecast?: boolean;
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

export interface CreditCard {
  id: string;
  name: string;
  owner: string;
  cardType?: string;
  lastFourDigits?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  symbol?: string;
  quantity?: number;
  purchasePrice?: number;
  currentPrice?: number;
  totalInvested?: number;
  currentValue?: number;
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category: GoalCategory;
  priority: GoalPriority;
  isCompleted: boolean;
  createdAt: string;
}

export interface HomeState {
  auth: AuthState;
  profile: UserProfile;
  tasks: Task[];
  finance: Transaction[];
  reminders: Reminder[];
  medications: Medication[];
  shoppingList: ShoppingItem[];
  creditCards: CreditCard[];
  investments: Investment[];
  financialGoals: FinancialGoal[];
  userPoints: number;
  theme: 'light' | 'dark';
}
