import { useState, useEffect } from 'react';
import { useStore } from '../store';
import {
  ClipboardList, Timer, Receipt, Layers, BarChart3, Users, FolderOpen,
  UserCircle, AlertTriangle, Archive, Settings, LogOut, Menu, X,
  Moon, Sun, Wifi, WifiOff, CalendarClock
} from 'lucide-react';

const pages = [
  { id: 'follows', label: 'المتابعة', icon: ClipboardList, section: 'العمليات' },
  { id: 'timers', label: 'التايمر', icon: Timer, section: null },
  { id: 'bookings', label: 'الحجوزات', icon: CalendarClock, section: null },
  { id: 'expenses', label: 'المصروفات', icon: Receipt, section: 'المالية' },
  { id: 'denominations', label: 'جرد الفئات', icon: Layers, section: null },
  { id: 'summary', label: 'الملخص والتقارير', icon: BarChart3, section: null },
  { id: 'pilots', label: 'الطيارين', icon: Users, section: 'الإدارة' },
  { id: 'driverfiles', label: 'ملفات الطيارين', icon: FolderOpen, section: null },
  { id: 'clients', label: 'العملاء', icon: UserCircle, section: null },
  { id: 'complaints', label: 'الشكاوى والمرتجعات', icon: AlertTriangle, section: null },
  { id: 'archive', label: 'الأرشيف الكامل', icon: Archive, section: null },
  { id: 'settings', label: 'الإعدادات', icon: Settings, section: null, adminOnly: true },
];

interface Props {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, setCurrentPage, children }: Props) {
  const { currentUser, logout, darkMode, toggleDarkMode, fontSize, setFontSize, syncStatus, state } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const branchName = state.branches[currentUser?.branch || 1] || 'الفرع 1';

  const upcomingBookings = (state.bookings || []).filter(b => {
    if (b.status !== 'pending') return false;
    const mins = (new Date(`${b.date}T${b.time}`).getTime() - Date.now()) / 60000;
    return mins <= (state.bookingPrefs?.beforeMin || 10) && mins >= -5;
  }).length;

  const bg = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const sidebarBg = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-800';
  const topbarBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`min-h-screen flex ${bg} transition-colors`} style={{ fontSize: `${fontSize}px` }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full z-50 transition-all duration-300 ${sidebarBg} text-white flex flex-col
        ${sidebarOpen ? 'w-64' : 'w-16'} 
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <span className="text-3xl">🥜</span>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold text-amber-400">بندق</h1>
              <p className="text-xs text-slate-400">V21</p>
            </div>
          )}
        </div>

        {/* User info */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-slate-700 text-sm">
            <p className="text-amber-300 font-semibold">{currentUser?.responsibleName}</p>
            <p className="text-slate-400 text-xs">{branchName} — {currentUser?.shift}</p>
          </div>
        )}

        {/* Clock */}
        {sidebarOpen && (
          <div className="px-4 py-2 text-center border-b border-slate-700">
            <span className="text-amber-400 font-mono text-lg">
              {clock.toLocaleTimeString('ar-EG')}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {pages.map((page, idx) => {
            if (page.adminOnly && !isAdmin) return null;
            const Icon = page.icon;
            const active = currentPage === page.id;
            const badge = page.id === 'bookings' && upcomingBookings > 0 ? upcomingBookings : null;
            const prevPage = pages[idx - 1];
            const showSection = page.section && sidebarOpen;
            return (
              <div key={page.id}>
                {showSection && (
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 pt-4 pb-1">
                    {page.section}
                  </p>
                )}
                <button onClick={() => { setCurrentPage(page.id); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all
                    ${active ? 'bg-amber-500/20 text-amber-400 border-r-4 border-amber-400' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border-r-4 border-transparent'}`}>
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="flex-1 text-right">{page.label}</span>
                  )}
                  {badge && (
                    <span className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                      {badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Controls */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>حجم الخط</span>
              <input type="range" min={12} max={18} value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="flex-1 accent-amber-400" />
              <span>{fontSize}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleDarkMode}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                {darkMode ? 'فاتح' : 'داكن'}
              </button>
              <button onClick={logout}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm">
                <LogOut size={16} />
                خروج
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:mr-64' : 'lg:mr-16'}`}>
        {/* Topbar */}
        <header className={`sticky top-0 z-30 ${topbarBg} border-b px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-1">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <Menu size={20} />
            </button>
            <div>
              <span className="font-semibold">{currentUser?.responsibleName}</span>
              <span className="text-sm text-gray-500 mr-2">— {branchName}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full
              ${syncStatus === 'synced' ? 'bg-green-100 text-green-700' : syncStatus === 'syncing' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {syncStatus === 'synced' ? <Wifi size={14} /> : <WifiOff size={14} />}
              {syncStatus === 'synced' ? 'متصل' : syncStatus === 'syncing' ? 'مزامنة...' : 'غير متصل'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 p-4 lg:p-6 ${cardBg} bg-opacity-0`}>
          {children}
        </main>
      </div>
    </div>
  );
}
