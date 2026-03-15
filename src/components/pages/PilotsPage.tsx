import { useState } from 'react';
import { useStore } from '../../store';
import { Plus, Trash2, Star, TrendingUp, Award, AlertCircle } from 'lucide-react';

const NEG_OPTIONS = [
  'عدم ارتداء الخوذة','عدم ارتداء السيفتي','تأخير متوسط','تأخير بدون سبب',
  'سوء تعامل مع العميل','خطأ في الأوردر','عدم الرد على الهاتف',
  'تلف بالطلب','شكوى من العميل','سرعة زائدة',
];

export default function PilotsPage() {
  const { state, currentUser, addPilot, deletePilot, addEvaluation, clearTodayEvaluations, darkMode } = useStore();
  const [newPilotName, setNewPilotName] = useState('');
  const [selectedPilot, setSelectedPilot] = useState('');
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [negatives, setNegatives] = useState<string[]>([]);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalComplaints, setEvalComplaints] = useState(0);
  const [evalReturns, setEvalReturns] = useState(0);
  const [view, setView] = useState<'cards' | 'leaderboard'>('leaderboard');

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const handleAdd = () => {
    if (!newPilotName.trim()) return;
    addPilot(newPilotName.trim());
    setNewPilotName('');
  };

  const openEval = (name: string) => {
    setSelectedPilot(name);
    setNegatives([]);
    setEvalNotes('');
    setEvalComplaints(0);
    setEvalReturns(0);
    setShowEvalModal(true);
  };

  const submitEval = () => {
    const criteria: Record<string, boolean> = {};
    NEG_OPTIONS.forEach(opt => { criteria[opt] = !negatives.includes(opt); });
    addEvaluation({
      pilotName: selectedPilot,
      criteria,
      date: new Date().toISOString(),
      evaluator: currentUser?.responsibleName || '',
    });
    setShowEvalModal(false);
  };

  // Build stats per pilot
  const pilotStats = state.pilots.map(name => {
    const trips = state.timers.filter(t => t.pilot === name && t.status === 'completed');
    const orders = state.orders.filter(o => o.pilot === name);
    const complaints = state.complaints.filter(c => c.pilot === name && c.type === 'شكوى');
    const returns = state.complaints.filter(c => c.pilot === name && c.type === 'مرتجع');
    const evals = state.evaluations.filter(e => e.pilotName === name);
    const revenue = orders.reduce((s, o) => s + o.total, 0) + trips.reduce((s, t) => s + t.total, 0);
    const avgTime = trips.length > 0
      ? Math.floor(trips.reduce((s, t) => s + (t.duration || 0), 0) / trips.length / 60)
      : 0;
    const negCount = evals.reduce((s, e) => s + Object.values(e.criteria).filter(v => !v).length, 0);
    const score = Math.max(0, 100 - (complaints.length * 10) - (returns.length * 5) - (negCount * 2));
    return { name, trips: trips.length, orders: orders.length, revenue, avgTime, complaints: complaints.length, returns: returns.length, evals: evals.length, score };
  }).sort((a, b) => b.score - a.score);

  const today = new Date().toISOString().split('T')[0];
  const todayEvals = state.evaluations.filter(e => e.date.startsWith(today));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">🚗 الطيارين</h1>
        <div className="flex gap-2">
          <button onClick={() => setView(v => v === 'cards' ? 'leaderboard' : 'cards')}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
            {view === 'leaderboard' ? '📋 بطاقات' : '🏆 الترتيب'}
          </button>
          {isAdmin && todayEvals.length > 0 && (
            <button onClick={() => { if (confirm('تصفير تقييمات اليوم؟')) clearTodayEvaluations(); }}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
              🔄 تصفير اليوم
            </button>
          )}
        </div>
      </div>

      {/* Add pilot */}
      {isAdmin && (
        <div className={`${cardBg} border rounded-xl p-4 flex gap-3`}>
          <input value={newPilotName} onChange={e => setNewPilotName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="اسم الطيار الجديد..."
            className={`flex-1 ${inputBg} border rounded-lg px-3 py-2`} />
          <button onClick={handleAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-bold">
            <Plus size={18} /> إضافة
          </button>
        </div>
      )}

      {/* Leaderboard View */}
      {view === 'leaderboard' && (
        <div className={`${cardBg} border rounded-xl overflow-hidden`}>
          <div className={`px-5 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className="font-bold flex items-center gap-2"><Award size={18} className="text-amber-500" /> ترتيب الطيارين</h2>
          </div>
          {pilotStats.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا يوجد طيارين مسجلين</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {pilotStats.map((p, idx) => (
                <div key={p.name} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0
                    ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-amber-700 text-white' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{p.name}</span>
                      {idx === 0 && <span className="text-xs">🏆</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                      <span>🛵 {p.trips} طلعة</span>
                      <span>💰 {p.revenue} ج</span>
                      {p.avgTime > 0 && <span>⏱ {p.avgTime} د</span>}
                      {p.complaints > 0 && <span className="text-red-500">⚠️ {p.complaints} شكوى</span>}
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="w-24 hidden md:block">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">النقاط</span>
                      <span className="font-bold">{p.score}</span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} overflow-hidden`}>
                      <div className={`h-full rounded-full ${p.score >= 80 ? 'bg-green-500' : p.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${p.score}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEval(p.name)}
                      className="flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1.5 rounded-lg text-xs font-bold">
                      <Star size={12} /> تقييم
                    </button>
                    {isAdmin && (
                      <button onClick={() => { if (confirm(`حذف ${p.name}?`)) deletePilot(p.name); }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pilotStats.map((p, idx) => (
            <div key={p.name} className={`${cardBg} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-black text-lg">{p.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= Math.round(p.score / 20) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                    ))}
                    <span className="text-xs text-gray-500 mr-1">{p.score}/100</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEval(p.name)}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded-lg text-xs font-bold">
                    تقييم
                  </button>
                  {isAdmin && (
                    <button onClick={() => { if (confirm(`حذف ${p.name}?`)) deletePilot(p.name); }}
                      className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-2 text-center`}>
                  <p className="text-gray-500 text-xs">الطلعات</p>
                  <p className="font-bold text-blue-600">{p.trips}</p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-2 text-center`}>
                  <p className="text-gray-500 text-xs">الإيرادات</p>
                  <p className="font-bold text-green-600">{p.revenue} ج</p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-2 text-center`}>
                  <p className="text-gray-500 text-xs">متوسط الوقت</p>
                  <p className="font-bold text-amber-600">{p.avgTime > 0 ? `${p.avgTime} د` : '—'}</p>
                </div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-2 text-center`}>
                  <p className="text-gray-500 text-xs">الشكاوى</p>
                  <p className={`font-bold ${p.complaints > 0 ? 'text-red-600' : 'text-gray-400'}`}>{p.complaints}</p>
                </div>
              </div>
            </div>
          ))}
          {state.pilots.length === 0 && (
            <div className={`col-span-full ${cardBg} border rounded-xl p-12 text-center text-gray-500`}>
              <p className="text-4xl mb-3">🛵</p>
              <p>لا يوجد طيارين مسجلين</p>
            </div>
          )}
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEvalModal(false)}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📊 تقييم — {selectedPilot}</h2>
            </div>
            <div className={`p-3 rounded-xl mb-4 text-sm ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'}`}>
              ✅ التقييم الافتراضي إيجابي — حدد السلبيات فقط إن وجدت
            </div>
            <div className="mb-4">
              <p className="font-bold text-sm mb-2">❌ مخالفات السلامة والأداء</p>
              <div className="grid grid-cols-2 gap-2">
                {NEG_OPTIONS.map(opt => (
                  <label key={opt} className={`flex items-center gap-2 text-xs p-2.5 rounded-xl cursor-pointer border transition-colors ${
                    negatives.includes(opt)
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700'
                      : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="checkbox" checked={negatives.includes(opt)}
                      onChange={e => setNegatives(prev => e.target.checked ? [...prev, opt] : prev.filter(n => n !== opt))}
                      className="w-3.5 h-3.5 flex-shrink-0" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">عدد الشكاوى</label>
                <input type="number" min={0} value={evalComplaints}
                  onChange={e => setEvalComplaints(Number(e.target.value))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">عدد المرتجعات</label>
                <input type="number" min={0} value={evalReturns}
                  onChange={e => setEvalReturns(Number(e.target.value))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ملاحظات إضافية</label>
              <textarea rows={2} value={evalNotes} onChange={e => setEvalNotes(e.target.value)}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
            </div>
            {negatives.length === 0 ? (
              <div className={`p-2 rounded mb-4 text-sm text-center ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'}`}>
                ✅ لا مخالفات — تقييم ممتاز
              </div>
            ) : (
              <div className={`p-2 rounded mb-4 text-sm text-center ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                ⚠️ {negatives.length} مخالفة مسجلة
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowEvalModal(false)}
                className={`flex-1 py-2.5 border rounded-xl ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                إلغاء
              </button>
              <button onClick={submitEval}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                💾 حفظ التقييم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
