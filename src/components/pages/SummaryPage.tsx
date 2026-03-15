import { useStore } from '../../store';
import { Printer, Lock, TrendingUp, TrendingDown, DollarSign, Truck, BarChart3 } from 'lucide-react';

export default function SummaryPage() {
  const { state, currentUser, closeShift, darkMode } = useStore();

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const orderRevenue = state.orders.reduce((s, o) => s + o.orderValue, 0);
  const deliveryRevenue = state.orders.reduce((s, o) => s + o.deliveryFee, 0);
  const timerRevenue = state.timers.filter(t => t.status === 'completed').reduce((s, t) => s + t.total, 0);
  const grossRevenue = state.orders.reduce((s, o) => s + o.total, 0) + timerRevenue;
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossRevenue - totalExpenses;

  const totalOrders = state.orders.length;
  const totalTrips = state.timers.filter(t => t.status === 'completed').length;
  const totalComplaints = state.complaints.filter(c => c.type === 'شكوى').length;
  const totalReturns = state.complaints.filter(c => c.type === 'مرتجع').length;

  // Source breakdown
  const sourceStats = ['واتساب', 'تليفون', 'حضوري', 'تطبيق'].map(src => ({
    name: src,
    count: state.orders.filter(o => o.source === src).length,
    revenue: state.orders.filter(o => o.source === src).reduce((s, o) => s + o.total, 0),
  })).filter(s => s.count > 0);

  // Branch breakdown
  const branchStats = Object.entries(state.branches).map(([bId, bName]) => {
    const bOrders = state.orders.filter(o => o.branch === Number(bId));
    return { branch: bName, orders: bOrders.length, revenue: bOrders.reduce((s, o) => s + o.total, 0) };
  }).filter(b => b.orders > 0);

  // Pilot breakdown
  const pilotStats = state.pilots.map(pilot => {
    const pTimers = state.timers.filter(t => t.pilot === pilot && t.status === 'completed');
    const pOrders = state.orders.filter(o => o.pilot === pilot);
    const avgTime = pTimers.length > 0 ? pTimers.reduce((s, t) => s + (t.duration || 0), 0) / pTimers.length : 0;
    return {
      pilot,
      trips: pTimers.length,
      orders: pOrders.length,
      revenue: pOrders.reduce((s, o) => s + o.total, 0) + pTimers.reduce((s, t) => s + t.total, 0),
      avgTime: Math.floor(avgTime / 60),
    };
  }).filter(p => p.trips > 0 || p.orders > 0).sort((a, b) => b.revenue - a.revenue);

  const handleCloseShift = () => {
    if (confirm('⚠️ هل أنت متأكد من إغلاق الشيفت؟\n\nسيتم نقل كل البيانات إلى الأرشيف وتصفير الشيفت الحالي.')) {
      closeShift();
    }
  };

  const KpiCard = ({ icon: Icon, label, value, sub, color, bgClass }: any) => (
    <div className={`${bgClass} rounded-2xl p-5 border`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl ${color}`}><Icon size={18} className="text-white" /></div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-black">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">📊 الملخص والتقارير</h1>
        <div className="flex gap-2 no-print">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            <Printer size={16} /> طباعة
          </button>
          {isAdmin && (
            <button onClick={handleCloseShift}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl">
              <Lock size={16} /> إغلاق الشيفت
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="إجمالي الإيرادات" value={`${grossRevenue} ج`}
          sub={`أوردر: ${orderRevenue} + توصيل: ${deliveryRevenue}`}
          color="bg-green-600"
          bgClass={darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'} />
        <KpiCard icon={TrendingDown} label="إجمالي المصروفات" value={`${totalExpenses} ج`}
          sub={`${state.expenses.length} بند مصروف`}
          color="bg-red-500"
          bgClass={darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} />
        <KpiCard icon={TrendingUp} label="صافي الربح" value={`${netProfit} ج`}
          sub={netProfit >= 0 ? '📈 ربح' : '📉 خسارة'}
          color={netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}
          bgClass={netProfit >= 0
            ? (darkMode ? 'bg-emerald-900/30 border-emerald-800' : 'bg-emerald-50 border-emerald-200')
            : (darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200')} />
        <KpiCard icon={Truck} label="إجمالي العمليات" value={totalOrders + totalTrips}
          sub={`${totalOrders} أوردر + ${totalTrips} طلعة`}
          color="bg-blue-600"
          bgClass={darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} />
      </div>

      {/* Extra stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'الأوردرات', value: totalOrders, color: 'text-blue-600' },
          { label: 'الطلعات المنتهية', value: totalTrips, color: 'text-purple-600' },
          { label: 'الشكاوى', value: totalComplaints, color: 'text-red-600' },
          { label: 'المرتجعات', value: totalReturns, color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className={`${cardBg} border rounded-xl p-4 text-center`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pilots performance */}
      {pilotStats.length > 0 && (
        <div className={`${cardBg} border rounded-2xl overflow-hidden`}>
          <div className={`px-5 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
            <h2 className="font-bold flex items-center gap-2"><BarChart3 size={18} /> أداء الطيارين</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <th className="text-right px-4 py-3 font-semibold text-gray-500">الطيار</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500">الطلعات</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500">الأوردرات</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500">الإيراد</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500">متوسط الوقت</th>
                </tr>
              </thead>
              <tbody>
                {pilotStats.map((p, i) => (
                  <tr key={p.pilot} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 font-bold">
                      {i === 0 && '🥇 '}{i === 1 && '🥈 '}{i === 2 && '🥉 '}{p.pilot}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600 font-semibold">{p.trips}</td>
                    <td className="px-4 py-3 text-center">{p.orders}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-bold">{p.revenue} ج</td>
                    <td className="px-4 py-3 text-center">
                      {p.avgTime > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.avgTime < 15 ? 'bg-green-100 text-green-700' : p.avgTime < 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {p.avgTime} د
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Source + Branch stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sourceStats.length > 0 && (
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <h2 className="font-bold mb-4">📱 توزيع مصادر الطلبات</h2>
            <div className="space-y-3">
              {sourceStats.map(s => {
                const pct = totalOrders > 0 ? Math.round((s.count / totalOrders) * 100) : 0;
                return (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-gray-500">{s.count} أوردر ({pct}%)</span>
                    </div>
                    <div className={`h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} overflow-hidden`}>
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {branchStats.length > 0 && (
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <h2 className="font-bold mb-4">🏢 إحصائيات الفروع</h2>
            <div className="space-y-2">
              {branchStats.map(b => (
                <div key={b.branch} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <span className="font-medium">{b.branch}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600 font-semibold">{b.orders} أوردر</span>
                    <span className="text-green-600 font-bold">{b.revenue} ج</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expenses breakdown */}
      {state.expenses.length > 0 && (
        <div className={`${cardBg} border rounded-2xl p-5`}>
          <h2 className="font-bold mb-4">💸 تفاصيل المصروفات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {state.expenses.map(e => (
              <div key={e.id} className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <span className="text-sm">{e.type}</span>
                <span className="font-bold text-red-600">{e.amount} ج</span>
              </div>
            ))}
          </div>
          <div className={`mt-3 flex justify-between font-black text-lg p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <span>الإجمالي</span>
            <span className="text-red-600">{totalExpenses} ج</span>
          </div>
        </div>
      )}
    </div>
  );
}
