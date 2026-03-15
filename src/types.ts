export type UserRole = 'user' | 'supervisor' | 'admin' | 'superadmin';
export type BookingStatus = 'pending' | 'done' | 'cancelled';

export interface Booking {
  id: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
  createdBy: string;
}
export type Shift = 'صباحي' | 'مسائي';
export type OrderSource = 'واتساب' | 'تليفون' | 'حضوري' | 'تطبيق';
export type OrderStatus = 'جديد' | 'قيد التنفيذ' | 'مكتمل';
export type CustomerBadge = 'جديد' | 'منتظم' | 'مخلص' | 'نجمة';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  branch: number;
  shift: Shift;
  responsibleName: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  pilot: string;
  receiver: string;
  shift: Shift;
  branch: number;
  orderValue: number;
  deliveryFee: number;
  total: number;
  details: string;
  source: OrderSource;
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
}

export interface TimerEntry {
  id: string;
  pilot: string;
  shift: Shift;
  branch: number;
  orderValue: number;
  deliveryFee: number;
  total: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'active' | 'completed';
  customerName?: string;
  phone?: string;
  orderId?: string;
}

export interface Expense {
  id: string;
  type: string;
  amount: number;
  date: string;
  createdBy: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  badge: CustomerBadge;
  firstOrderDate: string;
  totalOrders: number;
  totalPaid: number;
}

export interface Complaint {
  id: string;
  type: 'شكوى' | 'مرتجع';
  customerPhone?: string;
  customerName: string;
  pilot: string;
  responsible: string;
  details: string;
  returnCount?: number;
  date: string;
  createdBy: string;
}

export interface PilotEvaluation {
  id: string;
  pilotName: string;
  criteria: Record<string, boolean>;
  date: string;
  evaluator: string;
}

export interface DriverAttendance {
  id: string;
  pilotName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface AppState {
  users: User[];
  orders: Order[];
  timers: TimerEntry[];
  expenses: Expense[];
  customers: Customer[];
  complaints: Complaint[];
  evaluations: PilotEvaluation[];
  pilots: string[];
  branches: Record<number, string>;
  timerSettings: { warning: number; danger: number; target: number };
  archive: {
    orders: Order[];
    expenses: Expense[];
    complaints: Complaint[];
    evaluations: PilotEvaluation[];
  };
  driverAttendance: DriverAttendance[];
  bookings: Booking[];
  bookingPrefs: { enabled: boolean; beforeMin: number };
}
