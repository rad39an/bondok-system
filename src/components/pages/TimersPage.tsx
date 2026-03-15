import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Play, Square, Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Shift } from '../../types';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function TimerCard({ timer, onComplete, onDelete, settings, darkMode }: any) {
  const [elapsed, setElapsed] = useState(0);
  const [showEval, setShowEval] = useState(false);
  const [negatives, setNegatives] = useState<string[]>([]);

  useEffect(() => {
    if (timer.status === 'active') {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timer.startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer.duration) {
      setElapsed(timer.duration);
    }
  }, [timer]);

  const minutes = elapsed / 60;
  const isWarning = minutes >= settings.warning && minutes < settings.danger;
  const isDanger = minutes >= settings.danger;
  const borderColor = isDanger ? 'border-red-500' : isWarning ? 'border-amber-500' : 'border-green-500';
  const bgColor = isDanger
    ? (darkMode ? 'bg-red-900/20' : 'bg-red-50')
    : isWarning
      ? (darkMode ? 'bg-amber-900/20' : 'bg-amber-50')
      : (darkMode ? 'bg-green-900/20' : 'bg-green-50');
  const textColor = isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600';
  const icon = isDanger ? '🚨' : isWarning ? '⚠️' : '✅';

  const NEG_OPTIONS = [
    'عدم ارتداء الخوذة','عدم ارتداء السيفتي','تأخير متوسط','تأخير بدون سبب',
    'سوء تعامل مع العميل','خطأ في الأوردر','عدم الرد على الهاتف',
    'تلف بالطلب','شكوى من العميل','سرعة زائدة',
  ];

  const isBatch = (timer as any).isBatch && (timer as any).batchOrders?.length > 1;

  return (
    <div className={`border-2 ${borderColor} ${bgColor} rounded-2xl p-4 transition-all ${timer.status === 'completed' ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl">{icon}</span>
          <span className="font-black text-lg">{timer.pilot}</span>
          {isBatch && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">مجموعة {(timer as any).batchOrders.length}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'}`}>
            {timer.shift} · ف{timer.branch}
          </span>
        </div>
        <div className="flex gap-1">
          {timer.status === 'active' && (
            <button onClick={() => onComplete(timer.id)}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold">
              <Square size={12} /> إنهاء
            </button>
          )}
          {timer.status === 'completed' && (
            <button onClick={() => setShowEval(!showEval)}
              className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded-xl text-sm font-bold">
              ⭐ تقييم
            </button>
          )}
          <button onClick={() => onDelete(timer.id)}
            className={`p-1.5 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/70 hover:bg-white'}`}>
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>

      <div className={`text-5xl font-mono font-black text-center ${textColor} my-3 tracking-wide`}>
        {formatTime(elapsed)}
      </div>

      {!isBatch && (
        <div className={`grid grid-cols-3 gap-2 text-sm text-center p-2 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/60'}`}>
          <div><span className="text-gray-500 text-xs block">أوردر</span><span className="font-bold">{timer.orderValue} ج</span></div>
          <div><span className="text-gray-500 text-xs block">توصيل</span><span className="font-bold">{timer.deliveryFee} ج</span></div>
          <div><span className="text-gray-500 text-xs block">إجمالي</span><span className="font-bold text-green-600">{timer.total} ج</span></div>
        </div>
      )}

      {isBatch && (
        <div className="space-y-1 mt-2">
          {(timer as any).batchOrders.map((o: any, i: number) => (
            <div key={i} className={`flex justify-between text-sm px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <span>{o.customerName || `طلب ${i + 1}`}</span>
              <span className="font-bold text-green-600">{(o.orderValue || 0) + (o.deliveryFee || 0)} ج</span>
            </div>
          ))}
          <div className={`flex justify-between font-black text-base px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
            <span>الإجمالي</span>
            <span className="text-green-600">{timer.total} ج</span>
          </div>
        </div>
      )}

      {timer.customerName && !isBatch && <p className="text-sm text-gray-500 mt-2 text-center">👤 {timer.customerName}</p>}

      {timer.status === 'active' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>التقدم</span>
            <span>الهدف: {settings.target} دقيقة</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((minutes / settings.target) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {showEval && timer.status === 'completed' && (
        <div className={`mt-3 p-3 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
          <p className="text-sm font-bold mb-2">❌ حدد المخالفات (إن وجدت)</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {NEG_OPTIONS.map(opt => (
              <label key={opt} className={`flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer border transition-colors ${
                negatives.includes(opt)
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700'
                  : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="checkbox" checked={negatives.includes(opt)}
                  onChange={e => setNegatives(prev => e.target.checked ? [...prev, opt] : prev.filter(n => n !== opt))}
                  className="w-3 h-3" />
                {opt}
              </label>
            ))}
          </div>
          <div className={`text-xs p-2 rounded mb-2 ${negatives.length === 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {negatives.length === 0 ? '✅ لا مخالفات — تقييم ممتاز' : `⚠️ ${negatives.length} مخالفة مسجلة`}
          </div>
          <button onClick={() => setShowEval(false)}
            className="w-full py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold">
            حفظ التقييم
          </button>
        </div>
      )}
    </div>
  );
}

export default function TimersPage() {
  const { state, currentUser, addTimer, completeTimer, deleteTimer, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [form, setForm] = useState({
    pilot: '', shift: (currentUser?.shift || 'صباحي') as Shift,
    branch: currentUser?.branch || 1,
    orderValue: 0, deliveryFee: 0, customerName: '', phone: '',
  });
  const [batchPilot, setBatchPilot] = useState('');
  const [batchShift, setBatchShift] = useState<Shift>(currentUser?.shift || 'صباحي');
  const [batchBranch, setBatchBranch] = useState(currentUser?.branch || 1);
  const [batchItems, setBatchItems] = useState([{ customerName: '', orderValue: 0, deliveryFee: 0 }]);
  const [showCompleted, setShowCompleted] = useState(false);

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const activeTimers = state.timers.filter(t => t.status === 'active');
  const completedTimers = state.timers.filter(t => t.status === 'completed');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pilot) return;
    const total = form.orderValue + form.deliveryFee;
    addTimer({ ...form, total, status: 'active', startTime: Date.now() });
    setForm({ pilot: '', shift: currentUser?.shift || 'صباحي', branch: currentUser?.branch || 1, orderValue: 0, deliveryFee: 0, customerName: '', phone: '' });
    setShowForm(false);
  };

  const handleStartBatch = () => {
    if (!batchPilot) return;
    const valid = batchItems.filter(it => it.orderValue > 0 || it.deliveryFee > 0 || it.customerName);
    if (valid.length === 0) return;
    const total = valid.reduce((s, it) => s + (it.orderValue || 0) + (it.deliveryFee || 0), 0);
    addTimer({
      pilot: batchPilot, shift: batchShift, branch: batchBranch,
      orderValue: 0, deliveryFee: 0, total,
      status: 'active', startTime: Date.now(),
      isBatch: true, batchOrders: valid,
    } as any);
    setBatchItems([{ customerName: '', orderValue: 0, deliveryFee: 0 }]);
    setShowBatch(false);
  };

  const batchTotal = batchItems.reduce((s, it) => s + (it.orderValue || 0) + (it.deliveryFee || 0), 0);

  const shiftStats = {
    trips: completedTimers.length,
    revenue: completedTimers.reduce((s, t) => s + t.total, 0),
    avgTime: completedTimers.length > 0
      ? Math.floor(completedTimers.reduce((s, t) => s + (t.duration || 0), 0) / completedTimers.length / 60)
      : 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">⏱ التايمر</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBatch(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-semibold">
            🚀 طلعة مجموعة
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold">
            <Plus size={18} /> طلعة جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'طلعات منتهية', value: shiftStats.trips, color: 'text-blue-600', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
          { label: 'الإيراد', value: `${shiftStats.revenue} ج`, color: 'text-green-600', bg: darkMode ? 'bg-green-900/30' : 'bg-green-50' },
          { label: 'متوسط الوقت', value: `${shiftStats.avgTime} د`, color: 'text-amber-600', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50' },
          { label: 'نشط الآن', value: activeTimers.length, color: 'text-red-600', bg: darkMode ? 'bg-red-900/30' : 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className={`${cardBg} border rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">🚀 بدء طلعة جديدة</h2>
            <button onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleStart}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">الطيار *</label>
                <select required value={form.pilot} onChange={e => setForm(f => ({ ...f, pilot: e.target.value }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                  <option value="">اختر الطيار</option>
                  {state.pilots.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم العميل</label>
                <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">موبايل العميل</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">قيمة الأوردر (ج)</label>
                <input type="number" min={0} value={form.orderValue}
                  onChange={e => setForm(f => ({ ...f, orderValue: Number(e.target.value) }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">التوصيل (ج)</label>
                <input type="number" min={0} value={form.deliveryFee}
                  onChange={e => setForm(f => ({ ...f, deliveryFee: Number(e.target.value) }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الشيفت</label>
                <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value as Shift }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                  <option value="صباحي">صباحي</option>
                  <option value="مسائي">مسائي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الفرع</label>
                <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: Number(e.target.value) }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                  {Object.entries(state.branches).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className="text-sm text-gray-500">الإجمالي</span>
              <span className="font-black text-green-600 text-lg">{form.orderValue + form.deliveryFee} ج</span>
            </div>
            <button type="submit"
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">
              <Play size={18} /> بدء الطلعة
            </button>
          </form>
        </div>
      )}

      {activeTimers.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse inline-block" />
            الطلعات الجارية ({activeTimers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTimers.map(t => (
              <TimerCard key={t.id} timer={t} onComplete={completeTimer} onDelete={deleteTimer} settings={state.timerSettings} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}

      {activeTimers.length === 0 && !showForm && (
        <div className={`${cardBg} border rounded-xl p-8 text-center text-gray-500`}>
          <p className="text-4xl mb-3">🛵</p>
          <p>لا توجد طلعات جارية</p>
        </div>
      )}

      {completedTimers.length > 0 && (
        <div>
          <button onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 font-bold text-lg mb-3">
            {showCompleted ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            الطلعات المنتهية ({completedTimers.length})
          </button>
          {showCompleted && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedTimers.map(t => (
                <TimerCard key={t.id} timer={t} onComplete={completeTimer} onDelete={deleteTimer} settings={state.timerSettings} darkMode={darkMode} />
              ))}
            </div>
          )}
        </div>
      )}

      {showBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBatch(false)}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">🚀 طلعة مجموعة</h2>
              <button onClick={() => setShowBatch(false)}><X size={20} /></button>
            </div>
            <div className={`grid grid-cols-3 gap-3 p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div>
                <label className="block text-sm font-medium mb-1">🚗 الطيار *</label>
                <select value={batchPilot} onChange={e => setBatchPilot(e.target.value)}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                  <option value="">اختر الطيار</option>
                  {state.pilots.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">🕐 الشيفت</label>
                <select value={batchShift} onChange={e => setBatchShift(e.target.value as Shift)}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                  <option value="صباحي">صباحي</option>
                  <option value="مسائي">مسائي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">📍 الفرع</label>
                <select value={batchBranch} onChange={e => setBatchBranch(Number(e.target.value))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                  {Object.entries(state.branches).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">📦 الأوردرات</span>
              <button onClick={() => setBatchItems(prev => [...prev, { customerName: '', orderValue: 0, deliveryFee: 0 }])}
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                <Plus size={14} /> إضافة أوردر
              </button>
            </div>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {batchItems.map((item, idx) => (
                <div key={idx} className={`flex gap-2 items-center p-3 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                  <span className="text-sm font-bold text-gray-400 w-5 flex-shrink-0">{idx + 1}</span>
                  <input placeholder="اسم العميل" value={item.customerName}
                    onChange={e => setBatchItems(prev => prev.map((it, i) => i === idx ? { ...it, customerName: e.target.value } : it))}
                    className={`flex-1 ${inputBg} border rounded-lg px-2 py-1.5 text-sm`} />
                  <input type="number" min={0} placeholder="أوردر" value={item.orderValue || ''}
                    onChange={e => setBatchItems(prev => prev.map((it, i) => i === idx ? { ...it, orderValue: Number(e.target.value) } : it))}
                    className={`w-20 ${inputBg} border rounded-lg px-2 py-1.5 text-sm`} />
                  <input type="number" min={0} placeholder="توصيل" value={item.deliveryFee || ''}
                    onChange={e => setBatchItems(prev => prev.map((it, i) => i === idx ? { ...it, deliveryFee: Number(e.target.value) } : it))}
                    className={`w-20 ${inputBg} border rounded-lg px-2 py-1.5 text-sm`} />
                  <span className="text-xs font-bold text-green-600 w-14 text-right flex-shrink-0">
                    {(item.orderValue || 0) + (item.deliveryFee || 0)} ج
                  </span>
                  {batchItems.length > 1 && (
                    <button onClick={() => setBatchItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <span className="font-bold">إجمالي الطلعة</span>
              <span className="text-2xl font-black text-green-600">{batchTotal} ج</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBatch(false)}
                className={`flex-1 py-2.5 border rounded-xl ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                إلغاء
              </button>
              <button onClick={handleStartBatch} disabled={!batchPilot}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">
                <Play size={18} /> بدء الطلعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
