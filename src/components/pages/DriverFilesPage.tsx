import { useState } from 'react';
import { useStore } from '../../store';
import { FileText, Plus, X, Calendar, ChevronDown, ChevronUp, User, Phone, MapPin, Hash, Briefcase, AlertCircle, Printer } from 'lucide-react';

interface DriverProfile {
  fullName: string;
  phone: string;
  address: string;
  nationalId: string;
  fingerprintCode: string;
  hireDate: string;
  notes: string;
}

export default function DriverFilesPage() {
  const { state, currentUser, addDriverAttendance, darkMode } = useStore();
  const [selectedPilot, setSelectedPilot] = useState(state.pilots[0] || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'complaints' | 'trips' | 'profile'>('overview');
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAttForm, setShowAttForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [attForm, setAttForm] = useState({ date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '', notes: '' });
  const [profiles, setProfiles] = useState<Record<string, DriverProfile>>(() => {
    try { return JSON.parse(localStorage.getItem('bunduq_driver_profiles') || '{}'); } catch { return {}; }
  });
  const [profileForm, setProfileForm] = useState<DriverProfile>({ fullName: '', phone: '', address: '', nationalId: '', fingerprintCode: '', hireDate: '', notes: '' });
  const [confirmPass, setConfirmPass] = useState('');

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const saveProfile = (profiles: Record<string, DriverProfile>) => {
    localStorage.setItem('bunduq_driver_profiles', JSON.stringify(profiles));
    setProfiles(profiles);
  };

  // Filter by period
  const now = new Date();
  const filterDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (period === 'today') return d.toDateString() === now.toDateString();
    if (period === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === 'month') {
      const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
      return d >= monthAgo;
    }
    if (period === 'custom' && dateFrom && dateTo) {
      return dateStr.split('T')[0] >= dateFrom && dateStr.split('T')[0] <= dateTo;
    }
    return true;
  };

  const pilotTimers = state.timers.filter(t => t.pilot === selectedPilot && t.status === 'completed' && filterDate(new Date(t.startTime).toISOString()));
  const pilotOrders = state.orders.filter(o => o.pilot === selectedPilot && filterDate(o.createdAt));
  const pilotComplaints = state.complaints.filter(c => c.pilot === selectedPilot);
  const pilotReturns = pilotComplaints.filter(c => c.type === 'مرتجع');
  const pilotAttendance = state.driverAttendance.filter(a => a.pilotName === selectedPilot);
  const archiveTimers = state.archive.evaluations.filter((e: any) => e.pilotName === selectedPilot);

  const totalRevenue = pilotTimers.reduce((s, t) => s + t.total, 0);
  const avgTime = pilotTimers.length > 0
    ? Math.floor(pilotTimers.reduce((s, t) => s + (t.duration || 0), 0) / pilotTimers.length / 60)
    : 0;

  const currentProfile = profiles[selectedPilot] || { fullName: '', phone: '', address: '', nationalId: '', fingerprintCode: '', hireDate: '', notes: '' };

  const handleSaveProfile = () => {
    if (!confirmPass) { alert('أدخل كلمة مرورك لتأكيد الحفظ'); return; }
    const user = state.users.find(u => u.password === confirmPass);
    if (!user) { alert('كلمة المرور غير صحيحة'); return; }
    const updated = { ...profiles, [selectedPilot]: profileForm };
    saveProfile(updated);
    setShowProfileForm(false);
    setConfirmPass('');
  };

  const openProfileForm = () => {
    setProfileForm({ ...currentProfile });
    setShowProfileForm(true);
  };

  const handleAddAtt = () => {
    if (!attForm.checkIn) return;
    addDriverAttendance({
      pilotName: selectedPilot,
      date: attForm.date,
      checkIn: attForm.checkIn,
      checkOut: attForm.checkOut,
      notes: attForm.notes,
      createdBy: currentUser?.responsibleName || '',
      createdAt: new Date().toISOString(),
    });
    setShowAttForm(false);
    setAttForm({ date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '', notes: '' });
  };

  const tabs = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'trips', label: `الطلعات (${pilotTimers.length})` },
    { id: 'attendance', label: `الحضور (${pilotAttendance.length})` },
    { id: 'complaints', label: `الشكاوى (${pilotComplaints.length})` },
    { id: 'profile', label: 'الملف التعريفي' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText size={24} /> ملفات الطيارين</h1>
        <button onClick={() => window.print()} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
          <Printer size={16} /> طباعة
        </button>
      </div>

      {/* Pilot Selector + Period */}
      <div className={`${cardBg} border rounded-xl p-4 flex flex-wrap gap-3`}>
        <select value={selectedPilot} onChange={e => setSelectedPilot(e.target.value)}
          className={`${inputBg} border rounded-lg px-3 py-2 font-bold text-lg`}>
          {state.pilots.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className={`${inputBg} border rounded-lg px-3 py-2`}>
          <option value="all">كل الأوقات</option>
          <option value="today">اليوم</option>
          <option value="week">آخر 7 أيام</option>
          <option value="month">آخر 30 يوم</option>
          <option value="custom">مخصص</option>
        </select>
        {period === 'custom' && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2`} />
            <span className="flex items-center text-gray-500">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2`} />
          </>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'الطلعات', value: pilotTimers.length, color: 'text-blue-600', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50', border: darkMode ? 'border-blue-800' : 'border-blue-200' },
          { label: 'الإيرادات', value: `${totalRevenue} ج`, color: 'text-green-600', bg: darkMode ? 'bg-green-900/30' : 'bg-green-50', border: darkMode ? 'border-green-800' : 'border-green-200' },
          { label: 'متوسط الوقت', value: `${avgTime} د`, color: 'text-amber-600', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50', border: darkMode ? 'border-amber-800' : 'border-amber-200' },
          { label: 'الشكاوى', value: pilotComplaints.filter(c => c.type === 'شكوى').length, color: 'text-red-600', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50', border: darkMode ? 'border-red-800' : 'border-red-200' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`${cardBg} border rounded-xl overflow-hidden`}>
        <div className={`flex overflow-x-auto border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-semibold transition-colors
                ${activeTab === t.id
                  ? 'border-b-2 border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Performance chart visual */}
                <div>
                  <h3 className="font-bold mb-3">📊 أداء الطلعات</h3>
                  {pilotTimers.length === 0 ? (
                    <p className="text-gray-500 text-sm">لا توجد طلعات في هذه الفترة</p>
                  ) : (
                    <div className="space-y-2">
                      {['< 15 د (ممتاز)', '15-25 د (جيد)', '> 25 د (بطيء)'].map((label, i) => {
                        const counts = [
                          pilotTimers.filter(t => (t.duration || 0) < 900).length,
                          pilotTimers.filter(t => (t.duration || 0) >= 900 && (t.duration || 0) < 1500).length,
                          pilotTimers.filter(t => (t.duration || 0) >= 1500).length,
                        ];
                        const colors = ['bg-green-500', 'bg-amber-500', 'bg-red-500'];
                        const pct = pilotTimers.length > 0 ? (counts[i] / pilotTimers.length) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{label}</span>
                              <span className="font-bold">{counts[i]}</span>
                            </div>
                            <div className={`h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} overflow-hidden`}>
                              <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick info */}
                <div>
                  <h3 className="font-bold mb-3">ℹ️ معلومات سريعة</h3>
                  <div className="space-y-2 text-sm">
                    {currentProfile.phone && (
                      <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span>{currentProfile.phone}</span></div>
                    )}
                    {currentProfile.address && (
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /><span>{currentProfile.address}</span></div>
                    )}
                    {currentProfile.fingerprintCode && (
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-amber-500" />
                        <span className="font-bold text-amber-600">كود البصمة: {currentProfile.fingerprintCode}</span>
                      </div>
                    )}
                    {currentProfile.hireDate && (
                      <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400" /><span>تاريخ التعيين: {currentProfile.hireDate}</span></div>
                    )}
                    {currentProfile.nationalId && (
                      <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /><span>الرقم القومي: {currentProfile.nationalId}</span></div>
                    )}
                    {!currentProfile.phone && !currentProfile.fingerprintCode && (
                      <p className="text-gray-400 italic">لم يتم إضافة الملف التعريفي بعد</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRIPS TAB */}
          {activeTab === 'trips' && (
            <div className="space-y-2">
              {pilotTimers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد طلعات في هذه الفترة</p>
              ) : pilotTimers.slice().reverse().map(t => {
                const dur = Math.floor((t.duration || 0) / 60);
                const color = dur < 15 ? 'text-green-600' : dur < 25 ? 'text-amber-600' : 'text-red-600';
                return (
                  <div key={t.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3 flex items-center justify-between`}>
                    <div>
                      <span className="font-semibold">{t.customerName || 'طلعة'}</span>
                      {(t as any).isBatch && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mr-2">مجموعة</span>}
                      <p className="text-xs text-gray-500">{new Date(t.startTime).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-bold ${color}`}>{dur} د</span>
                      <span className="font-bold text-green-600">{t.total} ج</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">سجل الحضور</h3>
                <button onClick={() => setShowAttForm(true)}
                  className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-600">
                  <Plus size={14} /> تسجيل حضور
                </button>
              </div>
              {pilotAttendance.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات حضور</p>
              ) : (
                <div className="space-y-2">
                  {pilotAttendance.slice().reverse().map(att => {
                    const checkInTime = att.checkIn ? new Date(`2000-01-01T${att.checkIn}`).getTime() : 0;
                    const checkOutTime = att.checkOut ? new Date(`2000-01-01T${att.checkOut}`).getTime() : 0;
                    const hoursWorked = checkInTime && checkOutTime ? ((checkOutTime - checkInTime) / 3600000).toFixed(1) : null;
                    return (
                      <div key={att.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{att.date}</span>
                            <span className="text-sm text-green-600">دخول: {att.checkIn}</span>
                            {att.checkOut && <span className="text-sm text-red-600">خروج: {att.checkOut}</span>}
                            {hoursWorked && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{hoursWorked} ساعة</span>}
                          </div>
                        </div>
                        {att.notes && <p className="text-xs text-gray-500 mt-1">{att.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* COMPLAINTS TAB */}
          {activeTab === 'complaints' && (
            <div className="space-y-3">
              {pilotComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">✅</p>
                  <p className="text-gray-500">لا توجد شكاوى أو مرتجعات لهذا الطيار</p>
                </div>
              ) : pilotComplaints.map(c => (
                <div key={c.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.type === 'شكوى' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.type}
                    </span>
                    <span className="font-semibold">{c.customerName}</span>
                    <span className="text-xs text-gray-400 mr-auto">{new Date(c.date).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <p className="text-sm text-gray-500">{c.details}</p>
                </div>
              ))}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">الملف التعريفي — {selectedPilot}</h3>
                <button onClick={openProfileForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
                  ✏️ تعديل الملف
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: User, label: 'الاسم الكامل', value: currentProfile.fullName },
                  { icon: Phone, label: 'رقم الموبايل', value: currentProfile.phone },
                  { icon: MapPin, label: 'العنوان', value: currentProfile.address },
                  { icon: User, label: 'الرقم القومي', value: currentProfile.nationalId },
                  { icon: Hash, label: 'كود البصمة', value: currentProfile.fingerprintCode, highlight: true },
                  { icon: Briefcase, label: 'تاريخ التعيين', value: currentProfile.hireDate },
                ].map(({ icon: Icon, label, value, highlight }) => (
                  <div key={label} className={`p-3 rounded-xl border ${highlight ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={14} className={highlight ? 'text-amber-500' : 'text-gray-400'} />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                    <p className={`font-bold ${highlight ? 'text-amber-700 dark:text-amber-400 text-lg' : ''} ${!value ? 'text-gray-400 italic text-sm font-normal' : ''}`}>
                      {value || 'لم يُضف بعد'}
                    </p>
                  </div>
                ))}
                {currentProfile.notes && (
                  <div className={`col-span-full p-3 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <p className="text-xs text-gray-500 mb-1">ملاحظات</p>
                    <p className="text-sm">{currentProfile.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Form Modal */}
      {showAttForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAttForm(false)}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md p-6`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📝 تسجيل حضور — {selectedPilot}</h2>
              <button onClick={() => setShowAttForm(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">التاريخ</label>
                <input type="date" value={attForm.date} onChange={e => setAttForm(f => ({ ...f, date: e.target.value }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">وقت الدخول</label>
                  <input type="time" value={attForm.checkIn} onChange={e => setAttForm(f => ({ ...f, checkIn: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وقت الخروج</label>
                  <input type="time" value={attForm.checkOut} onChange={e => setAttForm(f => ({ ...f, checkOut: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <input value={attForm.notes} onChange={e => setAttForm(f => ({ ...f, notes: e.target.value }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
            </div>
            <button onClick={handleAddAtt} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold">
              💾 حفظ
            </button>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProfileForm(false)}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">👤 تعديل الملف — {selectedPilot}</h2>
              <button onClick={() => setShowProfileForm(false)}><X size={20} /></button>
            </div>
            <div className={`text-xs p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-gray-500`}>
              كل تعديل يُسجَّل باسمك وتاريخ اليوم ولا يمكن التراجع عنه
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'الاسم الكامل', key: 'fullName', type: 'text' },
                { label: 'رقم الموبايل', key: 'phone', type: 'tel' },
                { label: 'العنوان السكني', key: 'address', type: 'text' },
                { label: 'الرقم القومي', key: 'nationalId', type: 'text' },
                { label: 'تاريخ التعيين', key: 'hireDate', type: 'date' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} value={(profileForm as any)[key]}
                    onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1 text-amber-600">⭐ كود البصمة (مهم جداً)</label>
                <input type="text" value={profileForm.fingerprintCode}
                  onChange={e => setProfileForm(f => ({ ...f, fingerprintCode: e.target.value }))}
                  className={`w-full border-2 border-amber-400 rounded-lg px-3 py-2 font-bold text-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ملاحظات عامة</label>
                <textarea rows={3} value={profileForm.notes}
                  onChange={e => setProfileForm(f => ({ ...f, notes: e.target.value }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
            </div>
            <div className={`p-3 rounded-xl border-2 border-red-300 mb-4 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <label className="block text-sm font-bold text-red-600 mb-1">🔑 كلمة مرورك (مطلوبة للحفظ)</label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                placeholder="أدخل كلمة مرور حسابك"
                className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowProfileForm(false)}
                className={`flex-1 py-2.5 border rounded-xl ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                إلغاء
              </button>
              <button onClick={handleSaveProfile}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                💾 حفظ الملف التعريفي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
