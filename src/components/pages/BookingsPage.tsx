import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { Plus, X, Bell, BellOff, Edit2, Trash2, Check, XCircle, Clock } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';

function getMinutesUntil(date: string, time: string): number {
  const dt = new Date(`${date}T${time}`);
  return Math.floor((dt.getTime() - Date.now()) / 60000);
}

function formatBookingTime(date: string, time: string) {
  const dt = new Date(`${date}T${time}`);
  return dt.toLocaleString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function BookingsPage() {
  const { state, currentUser, addBooking, updateBooking, deleteBooking, updateBookingPrefs, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [alarmBooking, setAlarmBooking] = useState<Booking | null>(null);
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);
  const alarmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    clientName: '', phone: '', date: new Date().toISOString().split('T')[0],
    time: '', service: '', notes: '',
  });

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  // Live clock tick every 30s to refresh countdowns
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Alarm checker
  const checkAlarms = useCallback(() => {
    if (!state.bookingPrefs.enabled) return;
    const beforeMin = state.bookingPrefs.beforeMin;
    for (const b of state.bookings) {
      if (b.status !== 'pending') continue;
      if (snoozedIds.has(b.id)) continue;
      const mins = getMinutesUntil(b.date, b.time);
      if (mins <= beforeMin && mins >= -5) {
        setAlarmBooking(b);
        playAlarm();
        return;
      }
    }
  }, [state.bookings, state.bookingPrefs, snoozedIds]);

  useEffect(() => {
    alarmTimerRef.current = setInterval(checkAlarms, 60000);
    return () => { if (alarmTimerRef.current) clearInterval(alarmTimerRef.current); };
  }, [checkAlarms]);

  function playAlarm() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const times = [0, 0.3, 0.6, 0.9, 1.2];
      times.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.25);
      });
    } catch (e) { /* silent */ }
  }

  function testAlarm() { playAlarm(); }

  function dismissAlarm() {
    if (alarmBooking) updateBooking(alarmBooking.id, { status: 'done' });
    setAlarmBooking(null);
  }

  function snoozeAlarm() {
    if (alarmBooking) setSnoozedIds(prev => new Set([...prev, alarmBooking.id]));
    setAlarmBooking(null);
    setTimeout(() => {
      if (alarmBooking) setSnoozedIds(prev => { const s = new Set(prev); s.delete(alarmBooking.id); return s; });
    }, 5 * 60 * 1000);
  }

  const resetForm = () => {
    setForm({ clientName: '', phone: '', date: new Date().toISOString().split('T')[0], time: '', service: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.date || !form.time) return;
    if (editingId) {
      updateBooking(editingId, { ...form, status: 'pending' });
    } else {
      addBooking({ ...form, status: 'pending', createdBy: currentUser?.responsibleName || '' });
    }
    resetForm();
  };

  const startEdit = (b: Booking) => {
    setForm({ clientName: b.clientName, phone: b.phone, date: b.date, time: b.time, service: b.service, notes: b.notes });
    setEditingId(b.id);
    setShowForm(true);
  };

  // Filter
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const filtered = state.bookings.filter(b => {
    if (search && !b.clientName.includes(search) && !b.phone.includes(search)) return false;
    if (filterStatus && b.status !== filterStatus) return false;
    if (filterDate === 'today' && b.date !== today) return false;
    if (filterDate === 'tomorrow' && b.date !== tomorrow) return false;
    if (filterDate === 'week' && (b.date < today || b.date > weekEnd)) return false;
    return true;
  }).sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1);

  const stats = {
    total: state.bookings.length,
    pending: state.bookings.filter(b => b.status === 'pending').length,
    today: state.bookings.filter(b => b.date === today && b.status === 'pending').length,
    done: state.bookings.filter(b => b.status === 'done').length,
  };

  const getTimeBadge = (b: Booking) => {
    if (b.status !== 'pending') return null;
    const mins = getMinutesUntil(b.date, b.time);
    if (mins < 0) return { label: `متأخر ${Math.abs(mins)}د`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse' };
    if (mins <= state.bookingPrefs.beforeMin) return { label: `بعد ${mins}د 🚨`, cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 animate-pulse' };
    if (mins <= 60) return { label: `بعد ${mins}د`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40' };
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { label: `بعد ${hrs}س`, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' };
    return null;
  };

  const statusLabel: Record<BookingStatus, string> = { pending: '⏳ قادم', done: '✅ منتهى', cancelled: '❌ ملغي' };
  const statusColor: Record<BookingStatus, string> = {
    pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/40',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">🔔 الحجوزات</h1>
        <div className="flex gap-2">
          <button onClick={testAlarm}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
            🔊 اختبار الصوت
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">
            <Plus size={18} /> حجز جديد
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الحجوزات', value: stats.total, color: 'text-blue-600', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
          { label: 'قادم', value: stats.pending, color: 'text-amber-600', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50' },
          { label: 'اليوم', value: stats.today, color: 'text-red-600', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50' },
          { label: 'منتهى', value: stats.done, color: 'text-green-600', bg: darkMode ? 'bg-green-900/30' : 'bg-green-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Alarm Toggle */}
      <div className={`${cardBg} rounded-xl p-4 border flex flex-wrap gap-3 items-center`}>
        <input type="text" placeholder="🔍 بحث باسم العميل..." value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 min-w-[180px] ${inputBg} border rounded-lg py-2 px-3`} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`${inputBg} border rounded-lg px-3 py-2`}>
          <option value="">كل الحالات</option>
          <option value="pending">⏳ قادم</option>
          <option value="done">✅ منتهى</option>
          <option value="cancelled">❌ ملغي</option>
        </select>
        <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className={`${inputBg} border rounded-lg px-3 py-2`}>
          <option value="">كل الأيام</option>
          <option value="today">اليوم</option>
          <option value="tomorrow">غدًا</option>
          <option value="week">هذا الأسبوع</option>
        </select>
        {/* Alarm prefs */}
        <div className={`flex items-center gap-3 mr-auto px-3 py-2 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
          <button onClick={() => updateBookingPrefs({ ...state.bookingPrefs, enabled: !state.bookingPrefs.enabled })}
            className={`flex items-center gap-1 text-sm font-semibold ${state.bookingPrefs.enabled ? 'text-blue-600' : 'text-gray-400'}`}>
            {state.bookingPrefs.enabled ? <Bell size={16} /> : <BellOff size={16} />}
            {state.bookingPrefs.enabled ? 'المنبه مفعّل' : 'المنبه مغلق'}
          </button>
          <select value={state.bookingPrefs.beforeMin}
            onChange={e => updateBookingPrefs({ ...state.bookingPrefs, beforeMin: Number(e.target.value) })}
            className={`${inputBg} border rounded-lg px-2 py-1 text-xs`}>
            <option value={5}>قبل 5د</option>
            <option value={10}>قبل 10د</option>
            <option value={15}>قبل 15د</option>
            <option value={30}>قبل 30د</option>
            <option value={60}>قبل ساعة</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>
            <p className="text-4xl mb-3">📅</p>
            <p>لا توجد حجوزات</p>
          </div>
        ) : filtered.map(b => {
          const timeBadge = getTimeBadge(b);
          return (
            <div key={b.id} className={`${cardBg} border-2 rounded-xl p-4 transition-all hover:shadow-md
              ${b.status === 'pending' && getMinutesUntil(b.date, b.time) <= state.bookingPrefs.beforeMin && getMinutesUntil(b.date, b.time) >= -5
                ? 'border-red-400 dark:border-red-600' : darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-lg">{b.clientName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                    {timeBadge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${timeBadge.cls}`}>
                        {timeBadge.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {formatBookingTime(b.date, b.time)}
                    </span>
                    {b.phone && <span>📱 {b.phone}</span>}
                    {b.service && <span>🎯 {b.service}</span>}
                  </div>
                  {b.notes && <p className={`text-sm mt-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>{b.notes}</p>}
                </div>
                <div className="flex gap-1">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => updateBooking(b.id, { status: 'done' })}
                        className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200" title="تم">
                        <Check size={14} />
                      </button>
                      <button onClick={() => updateBooking(b.id, { status: 'cancelled' })}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200" title="إلغاء">
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  <button onClick={() => startEdit(b)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteBooking(b.id)}
                    className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-lg p-6`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingId ? '✏️ تعديل الحجز' : '📅 حجز جديد'}</h2>
              <button onClick={resetForm} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم العميل *</label>
                  <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم الموبايل</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ الحجز *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وقت الحجز *</label>
                  <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">نوع الحجز / الخدمة</label>
                  <input value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                    placeholder="مثال: طلب توصيل، اجتماع، موعد..."
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">ملاحظات</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
              </div>
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                🔔 سيتم إرسال تنبيه صوتي قبل الموعد بـ {state.bookingPrefs.beforeMin} دقيقة
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={resetForm}
                  className={`px-6 py-2 border rounded-xl ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}>إلغاء</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                  {editingId ? 'تحديث' : 'حفظ الحجز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alarm Overlay */}
      {alarmBooking && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl
            ring-4 ring-red-500 animate-bounce-once`}>
            <div className="text-6xl mb-4 animate-bounce">⏰</div>
            <h2 className="text-2xl font-black mb-2">تنبيه حجز!</h2>
            <p className="text-lg font-bold mb-1">{alarmBooking.clientName}</p>
            {alarmBooking.service && <p className="text-gray-500 mb-1">{alarmBooking.service}</p>}
            <p className="text-blue-600 font-semibold mb-4">{formatBookingTime(alarmBooking.date, alarmBooking.time)}</p>
            {alarmBooking.notes && <p className={`text-sm mb-4 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>{alarmBooking.notes}</p>}
            <div className="text-2xl font-black text-red-600 mb-6 font-mono">
              {(() => { const m = getMinutesUntil(alarmBooking.date, alarmBooking.time); return m >= 0 ? `بعد ${m} دقيقة` : `متأخر ${Math.abs(m)} دقيقة`; })()}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={snoozeAlarm}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold">
                ⏸ تأجيل 5 دقائق
              </button>
              <button onClick={dismissAlarm}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold">
                ✅ تم الاستلام
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
