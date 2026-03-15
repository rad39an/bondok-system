import { useState } from 'react';
import { useStore } from '../../store';
import { RefreshCw } from 'lucide-react';

const DENOMINATIONS = [200, 100, 50, 20, 10, 5, 1, 0.5, 0.25];

export default function DenominationsPage() {
  const { state, darkMode } = useStore();
  const [counts, setCounts] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('bunduq_cash_counts');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const saveCounts = (newCounts: Record<number, number>) => {
    localStorage.setItem('bunduq_cash_counts', JSON.stringify(newCounts));
    setCounts(newCounts);
  };

  const handleChange = (denom: number, value: string) => {
    const num = parseInt(value) || 0;
    const updated = { ...counts, [denom]: num };
    saveCounts(updated);
  };

  const clearAll = () => {
    if (confirm('مسح كل الأعداد؟')) {
      saveCounts({});
    }
  };

  const totalCash = DENOMINATIONS.reduce((sum, d) => sum + (counts[d] || 0) * d, 0);

  // Expected cash from orders
  const totalOrderRevenue = state.orders.reduce((s, o) => s + o.total, 0);
  const totalTimerRevenue = state.timers.filter(t => t.status === 'completed').reduce((s, t) => s + t.total, 0);
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const expectedCash = totalOrderRevenue + totalTimerRevenue - totalExpenses;
  const difference = totalCash - expectedCash;

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">💵 جرد الفئات النقدية</h1>
        <button onClick={clearAll} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>
          <RefreshCw size={14} /> مسح الكل
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'} border rounded-2xl p-5 text-center`}>
          <p className="text-sm text-gray-500 mb-1">إجمالي الكاش المعدود</p>
          <p className="text-4xl font-black text-green-600">{totalCash.toLocaleString('ar-EG')} ج</p>
        </div>
        <div className={`${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-2xl p-5 text-center`}>
          <p className="text-sm text-gray-500 mb-1">الكاش المتوقع (إيرادات - مصروفات)</p>
          <p className="text-4xl font-black text-blue-600">{expectedCash.toLocaleString('ar-EG')} ج</p>
        </div>
        <div className={`${difference === 0 ? (darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200') : difference > 0 ? (darkMode ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-200') : (darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200')} border rounded-2xl p-5 text-center`}>
          <p className="text-sm text-gray-500 mb-1">الفرق</p>
          <p className={`text-4xl font-black ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {difference > 0 ? '+' : ''}{difference.toLocaleString('ar-EG')} ج
          </p>
          <p className="text-xs mt-1 text-gray-500">
            {difference === 0 ? '✅ مطابق تماماً' : difference > 0 ? '⬆️ زيادة' : '⬇️ عجز'}
          </p>
        </div>
      </div>

      {/* Denominations Grid */}
      <div className={`${cardBg} border rounded-2xl overflow-hidden`}>
        <div className={`px-5 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className="grid grid-cols-4 text-sm font-semibold text-gray-500">
            <span>الفئة</span>
            <span className="text-center">العدد</span>
            <span className="text-center">المجموع</span>
            <span className="text-center">%</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {DENOMINATIONS.map(denom => {
            const count = counts[denom] || 0;
            const subtotal = count * denom;
            const pct = totalCash > 0 ? Math.round((subtotal / totalCash) * 100) : 0;
            return (
              <div key={denom} className={`grid grid-cols-4 items-center px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-black text-sm
                    ${denom >= 100 ? 'bg-green-100 text-green-700' : denom >= 10 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {denom}
                  </span>
                  <span className="text-xs text-gray-400">ج</span>
                </div>
                <div className="text-center">
                  <input
                    type="number" min={0} value={count || ''}
                    onChange={e => handleChange(denom, e.target.value)}
                    placeholder="0"
                    className={`w-20 text-center ${inputBg} border rounded-lg px-2 py-1.5 font-bold`}
                  />
                </div>
                <div className="text-center font-bold text-green-600">
                  {subtotal > 0 ? subtotal.toLocaleString('ar-EG') + ' ج' : '—'}
                </div>
                <div className="text-center">
                  {pct > 0 && (
                    <div className="flex items-center gap-1 justify-center">
                      <div className={`h-2 rounded-full bg-blue-400`} style={{ width: `${Math.max(pct, 5)}px` }} />
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <span className="font-black text-lg">الإجمالي</span>
            <span className="font-black text-2xl text-green-600">{totalCash.toLocaleString('ar-EG')} ج</span>
          </div>
        </div>
      </div>
    </div>
  );
}
