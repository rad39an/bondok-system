import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, Order, TimerEntry, Expense, Customer, Complaint, PilotEvaluation, AppState, DriverAttendance, CustomerBadge, Booking } from './types';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const defaultBranches: Record<number, string> = {
  1: 'الفرع 1', 2: 'الفرع 2', 3: 'الفرع 3', 4: 'الفرع 4',
  5: 'الفرع 5', 6: 'الفرع 6', 7: 'الفرع 7'
};

const defaultUsers: User[] = [
  { id: '1', username: 'admin', password: 'admin123', role: 'superadmin', branch: 1, shift: 'صباحي', responsibleName: 'المدير العام' },
  { id: '2', username: 'supervisor1', password: '123456', role: 'supervisor', branch: 1, shift: 'صباحي', responsibleName: 'المشرف أحمد' },
  { id: '3', username: 'user1', password: '123456', role: 'user', branch: 1, shift: 'صباحي', responsibleName: 'الموظف محمد' },
];

const defaultPilots = ['أحمد الطيار', 'محمد السائق', 'خالد التوصيل', 'عمر الشحن', 'ياسر الطيار'];

const initialState: AppState = {
  users: defaultUsers,
  orders: [],
  timers: [],
  expenses: [],
  customers: [],
  complaints: [],
  evaluations: [],
  pilots: defaultPilots,
  branches: defaultBranches,
  timerSettings: { warning: 15, danger: 25, target: 20 },
  archive: { orders: [], expenses: [], complaints: [], evaluations: [] },
  driverAttendance: [],
  bookings: [],
  bookingPrefs: { enabled: true, beforeMin: 10 },
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem('bunduq_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch (e) { /* ignore */ }
  return initialState;
}

function saveState(state: AppState) {
  localStorage.setItem('bunduq_state', JSON.stringify(state));
}

function getCustomerBadge(totalOrders: number): CustomerBadge {
  if (totalOrders >= 25) return 'نجمة';
  if (totalOrders >= 10) return 'مخلص';
  if (totalOrders >= 2) return 'منتظم';
  return 'جديد';
}

interface StoreContextType {
  state: AppState;
  currentUser: User | null;
  login: (username: string, password: string) => User | null;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addTimer: (timer: Omit<TimerEntry, 'id'>) => void;
  completeTimer: (id: string) => void;
  deleteTimer: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addComplaint: (complaint: Omit<Complaint, 'id'>) => void;
  deleteComplaint: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'badge'>) => void;
  updateCustomerOrders: (phone: string, name: string, address: string, amount: number) => void;
  findCustomerByPhone: (phone: string) => Customer | undefined;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addPilot: (name: string) => void;
  deletePilot: (name: string) => void;
  updateTimerSettings: (settings: { warning: number; danger: number; target: number }) => void;
  updateBranchName: (branch: number, name: string) => void;
  closeShift: () => void;
  addEvaluation: (eval_: Omit<PilotEvaluation, 'id'>) => void;
  clearTodayEvaluations: () => void;
  deleteArchiveItems: (type: string, ids: string[]) => void;
  importCustomers: (customers: Omit<Customer, 'id' | 'badge'>[]) => void;
  addDriverAttendance: (att: Omit<DriverAttendance, 'id'>) => void;
  addBooking: (b: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  updateBookingPrefs: (prefs: { enabled: boolean; beforeMin: number }) => void;
  toasts: { id: string; msg: string; type: 'success' | 'error' }[];
  syncStatus: 'synced' | 'syncing' | 'error';
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('bunduq_user');
    if (saved) return JSON.parse(saved);
    return null;
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('bunduq_dark') === 'true');
  const [fontSize, setFontSizeState] = useState(() => parseInt(localStorage.getItem('bunduq_fontsize') || '14'));
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'success' | 'error' }[]>([]);
  const [syncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { localStorage.setItem('bunduq_dark', String(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('bunduq_fontsize', String(fontSize)); }, [fontSize]);

  const toast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const login = useCallback((username: string, password: string): User | null => {
    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('bunduq_user', JSON.stringify(user));
    }
    return user || null;
  }, [state.users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem('bunduq_user');
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);
  const setFontSize = useCallback((s: number) => setFontSizeState(s), []);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = { ...order, id: generateId(), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, orders: [...prev.orders, newOrder] }));
    toast('تم إضافة الأوردر بنجاح');
  }, [toast]);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setState(prev => ({ ...prev, orders: prev.orders.map(o => o.id === id ? { ...o, ...updates } : o) }));
    toast('تم تحديث الأوردر');
  }, [toast]);

  const deleteOrder = useCallback((id: string) => {
    setState(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
    toast('تم حذف الأوردر');
  }, [toast]);

  const addTimer = useCallback((timer: Omit<TimerEntry, 'id'>) => {
    setState(prev => ({ ...prev, timers: [...prev.timers, { ...timer, id: generateId() }] }));
    toast('تم بدء الطلعة');
  }, [toast]);

  const completeTimer = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      timers: prev.timers.map(t => t.id === id ? {
        ...t,
        status: 'completed' as const,
        endTime: Date.now(),
        duration: Math.floor((Date.now() - t.startTime) / 1000)
      } : t)
    }));
    toast('تم إنهاء الطلعة');
  }, [toast]);

  const deleteTimer = useCallback((id: string) => {
    setState(prev => ({ ...prev, timers: prev.timers.filter(t => t.id !== id) }));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setState(prev => ({ ...prev, expenses: [...prev.expenses, { ...expense, id: generateId() }] }));
    toast('تم تسجيل المصروف');
  }, [toast]);

  const deleteExpense = useCallback((id: string) => {
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    toast('تم حذف المصروف');
  }, [toast]);

  const addComplaint = useCallback((complaint: Omit<Complaint, 'id'>) => {
    setState(prev => ({ ...prev, complaints: [...prev.complaints, { ...complaint, id: generateId() }] }));
    toast(complaint.type === 'شكوى' ? 'تم تسجيل الشكوى' : 'تم تسجيل المرتجع');
  }, [toast]);

  const deleteComplaint = useCallback((id: string) => {
    setState(prev => ({ ...prev, complaints: prev.complaints.filter(c => c.id !== id) }));
    toast('تم الحذف');
  }, [toast]);

  const findCustomerByPhone = useCallback((phone: string) => {
    return state.customers.find(c => c.phone === phone);
  }, [state.customers]);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'badge'>) => {
    const existing = state.customers.find(c => c.phone === customer.phone);
    if (existing) return;
    setState(prev => ({
      ...prev,
      customers: [...prev.customers, { ...customer, id: generateId(), badge: getCustomerBadge(customer.totalOrders) }]
    }));
  }, [state.customers]);

  const updateCustomerOrders = useCallback((phone: string, name: string, address: string, amount: number) => {
    setState(prev => {
      const existing = prev.customers.find(c => c.phone === phone);
      if (existing) {
        const newTotal = existing.totalOrders + 1;
        return {
          ...prev,
          customers: prev.customers.map(c => c.phone === phone ? {
            ...c,
            name, address,
            totalOrders: newTotal,
            totalPaid: c.totalPaid + amount,
            badge: getCustomerBadge(newTotal)
          } : c)
        };
      } else {
        return {
          ...prev,
          customers: [...prev.customers, {
            id: generateId(), name, phone, address,
            badge: 'جديد', firstOrderDate: new Date().toISOString(),
            totalOrders: 1, totalPaid: amount
          }]
        };
      }
    });
  }, []);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    setState(prev => ({ ...prev, users: [...prev.users, { ...user, id: generateId() }] }));
    toast('تم إضافة المستخدم');
  }, [toast]);

  const deleteUser = useCallback((id: string) => {
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
    toast('تم حذف المستخدم');
  }, [toast]);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setState(prev => ({ ...prev, users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u) }));
    toast('تم تحديث المستخدم');
  }, [toast]);

  const addPilot = useCallback((name: string) => {
    setState(prev => ({ ...prev, pilots: [...prev.pilots, name] }));
    toast('تم إضافة الطيار');
  }, [toast]);

  const deletePilot = useCallback((name: string) => {
    setState(prev => ({ ...prev, pilots: prev.pilots.filter(p => p !== name) }));
    toast('تم حذف الطيار');
  }, [toast]);

  const updateTimerSettings = useCallback((settings: { warning: number; danger: number; target: number }) => {
    setState(prev => ({ ...prev, timerSettings: settings }));
    toast('تم تحديث إعدادات التايمر');
  }, [toast]);

  const updateBranchName = useCallback((branch: number, name: string) => {
    setState(prev => ({ ...prev, branches: { ...prev.branches, [branch]: name } }));
    toast('تم تحديث اسم الفرع');
  }, [toast]);

  const closeShift = useCallback(() => {
    setState(prev => ({
      ...prev,
      archive: {
        orders: [...prev.archive.orders, ...prev.orders.map(o => ({ ...o, status: 'مكتمل' as const }))],
        expenses: [...prev.archive.expenses, ...prev.expenses],
        complaints: [...prev.archive.complaints, ...prev.complaints],
        evaluations: [...prev.archive.evaluations, ...prev.evaluations],
      },
      orders: [],
      timers: [],
      expenses: [],
      complaints: [],
      evaluations: [],
    }));
    toast('تم إغلاق الشيفت ونقل البيانات للأرشيف');
  }, [toast]);

  const addEvaluation = useCallback((eval_: Omit<PilotEvaluation, 'id'>) => {
    setState(prev => ({ ...prev, evaluations: [...prev.evaluations, { ...eval_, id: generateId() }] }));
    toast('تم حفظ التقييم');
  }, [toast]);

  const clearTodayEvaluations = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setState(prev => ({
      ...prev,
      evaluations: prev.evaluations.filter(e => !e.date.startsWith(today))
    }));
    toast('تم تصفير تقييمات اليوم');
  }, [toast]);

  const deleteArchiveItems = useCallback((type: string, ids: string[]) => {
    setState(prev => {
      const archive = { ...prev.archive };
      if (type === 'orders') archive.orders = archive.orders.filter(o => !ids.includes(o.id));
      if (type === 'expenses') archive.expenses = archive.expenses.filter(e => !ids.includes(e.id));
      if (type === 'complaints') archive.complaints = archive.complaints.filter(c => !ids.includes(c.id));
      if (type === 'evaluations') archive.evaluations = archive.evaluations.filter(e => !ids.includes(e.id));
      return { ...prev, archive };
    });
    toast('تم حذف العناصر المحددة');
  }, [toast]);

  const importCustomers = useCallback((customers: Omit<Customer, 'id' | 'badge'>[]) => {
    setState(prev => {
      const newCustomers = customers
        .filter(c => !prev.customers.find(existing => existing.phone === c.phone))
        .map(c => ({ ...c, id: generateId(), badge: getCustomerBadge(c.totalOrders) as Customer['badge'] }));
      return { ...prev, customers: [...prev.customers, ...newCustomers] };
    });
    toast('تم استيراد العملاء');
  }, [toast]);

  const addDriverAttendance = useCallback((att: Omit<DriverAttendance, 'id'>) => {
    setState(prev => ({
      ...prev,
      driverAttendance: [...prev.driverAttendance, { ...att, id: generateId() }]
    }));
    toast('تم تسجيل الحضور');
  }, [toast]);

  const addBooking = useCallback((b: Omit<Booking, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      bookings: [...prev.bookings, { ...b, id: generateId(), createdAt: new Date().toISOString() }]
    }));
    toast('تم حفظ الحجز');
  }, [toast]);

  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setState(prev => ({ ...prev, bookings: prev.bookings.map(b => b.id === id ? { ...b, ...updates } : b) }));
    toast('تم تحديث الحجز');
  }, [toast]);

  const deleteBooking = useCallback((id: string) => {
    setState(prev => ({ ...prev, bookings: prev.bookings.filter(b => b.id !== id) }));
    toast('تم حذف الحجز');
  }, [toast]);

  const updateBookingPrefs = useCallback((prefs: { enabled: boolean; beforeMin: number }) => {
    setState(prev => ({ ...prev, bookingPrefs: prefs }));
  }, []);

  return (
    <StoreContext.Provider value={{
      state, currentUser, login, logout, darkMode, toggleDarkMode, fontSize, setFontSize,
      addOrder, updateOrder, deleteOrder, addTimer, completeTimer, deleteTimer,
      addExpense, deleteExpense, addComplaint, deleteComplaint, addCustomer,
      updateCustomerOrders, findCustomerByPhone, addUser, deleteUser, updateUser,
      addPilot, deletePilot, updateTimerSettings, updateBranchName, closeShift,
      addEvaluation, clearTodayEvaluations, deleteArchiveItems, importCustomers,
      addDriverAttendance, addBooking, updateBooking, deleteBooking, updateBookingPrefs,
      toast, toasts, syncStatus,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
