import { useState } from 'react';
import { useStore } from '../../store';
import { Search, Trash2, Download, Archive } from 'lucide-react';

export default function ArchivePage() {
  const { state, currentUser, deleteArchiveItems, darkMode } = useStore();
  const [tab, setTab] = useState('orders');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const tabs = [
    { id: 'orders', label: 'المتابعات', count: state.archive.orders.length },
    { id: 'expenses', label: 'المصروفات', count: state.archive.expenses.length },
    { id: 'complaints', label: 'الشكاوى', count: state.archive.complaints.filter(c => c.type === 'شكوى').length },
    { id: 'returns', label: 'المرتجعات', count: state.archive.complaints.filter(c => c.type === 'مرتجع').length },
    { id: 'evaluations', label: 'التقييمات', count: state.archive.evaluations.length },
    { id: 'customers', label: 'العملاء', count: state.customers.length },
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = (ids: string[]) => {
    if (ids.every(id => selectedIds.includes(id))) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleDelete = () => {
    if (!confirm('هل أنت متأكد من حذف العناصر المحددة نهائياً؟')) return;
    if (tab === 'returns') {
      deleteArchiveItems('complaints', selectedIds);
    } else {
      deleteArchiveItems(tab, selectedIds);
    }
    setSelectedIds([]);
  };

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    if (state.archive.orders.length > 0) {
      const ws = XLSX.utils.json_to_sheet(state.archive.orders.map(o => ({
        'العميل': o.customerName, 'الموبايل': o.phone, 'العنوان': o.address,
        'الطيار': o.pilot, 'الإجمالي': o.total, 'التاريخ': o.createdAt,
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'الأوردرات');
    }
    if (state.archive.expenses.length > 0) {
      const ws = XLSX.utils.json_to_sheet(state.archive.expenses.map(e => ({
        'النوع': e.type, 'المبلغ': e.amount, 'التاريخ': e.date,
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'المصروفات');
    }
    if (state.archive.complaints.length > 0) {
      const ws = XLSX.utils.json_to_sheet(state.archive.complaints.map(c => ({
        'النوع': c.type, 'العميل': c.customerName, 'الطيار': c.pilot, 'التفاصيل': c.details, 'التاريخ': c.date,
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'الشكاوى');
    }
    if (state.customers.length > 0) {
      const ws = XLSX.utils.json_to_sheet(state.customers.map(c => ({
        'الاسم': c.name, 'الموبايل': c.phone, 'العنوان': c.address,
        'التصنيف': c.badge, 'عدد الطلبات': c.totalOrders, 'إجمالي المدفوع': c.totalPaid,
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'العملاء');
    }

    XLSX.writeFile(wb, `أرشيف_بندق_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  const archiveOrders = state.archive.orders.filter(o =>
    !search || o.customerName.includes(search) || o.phone.includes(search)
  );
  const archiveExpenses = state.archive.expenses;
  const archiveComplaints = state.archive.complaints.filter(c => c.type === 'شكوى');
  const archiveReturns = state.archive.complaints.filter(c => c.type === 'مرتجع');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Archive size={24} /> الأرشيف الكامل</h1>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl">
            <Download size={16} /> تصدير Excel
          </button>
          {isAdmin && selectedIds.length > 0 && (
            <button onClick={handleDelete}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl">
              <Trash2 size={16} /> حذف ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl p-3 border text-center`}>
          <p className="text-xs text-gray-500">المتابعات</p>
          <p className="text-2xl font-bold text-blue-600">{state.archive.orders.length}</p>
        </div>
        <div className={`${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-xl p-3 border text-center`}>
          <p className="text-xs text-gray-500">إجمالي المبالغ</p>
          <p className="text-2xl font-bold text-green-600">{state.archive.orders.reduce((s, o) => s + o.total, 0)} ج</p>
        </div>
        <div className={`${darkMode ? 'bg-red-900/30' : 'bg-red-50'} rounded-xl p-3 border text-center`}>
          <p className="text-xs text-gray-500">الشكاوى</p>
          <p className="text-2xl font-bold text-red-600">{archiveComplaints.length}</p>
        </div>
        <div className={`${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} rounded-xl p-3 border text-center`}>
          <p className="text-xs text-gray-500">المرتجعات</p>
          <p className="text-2xl font-bold text-amber-600">{archiveReturns.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors
              ${tab === t.id ? 'bg-amber-500 text-white' : `${cardBg} border hover:bg-gray-100 dark:hover:bg-gray-700`}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 text-gray-400" size={18} />
        <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
          className={`w-full ${inputBg} border rounded-xl py-3 pr-10 pl-4`} />
      </div>

      {/* Content */}
      {tab === 'orders' && (
        <div className="space-y-2">
          {archiveOrders.length > 0 && isAdmin && (
            <button onClick={() => selectAll(archiveOrders.map(o => o.id))}
              className="text-sm text-amber-500 hover:underline">
              {archiveOrders.every(o => selectedIds.includes(o.id)) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </button>
          )}
          {archiveOrders.map(order => (
            <div key={order.id} className={`${cardBg} border rounded-xl p-4 flex items-center gap-3`}>
              {isAdmin && (
                <input type="checkbox" checked={selectedIds.includes(order.id)}
                  onChange={() => toggleSelect(order.id)} className="w-4 h-4 accent-amber-500" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{order.customerName}</span>
                  <span className="text-sm text-gray-500">{order.phone}</span>
                </div>
                <div className="flex gap-3 text-sm text-gray-400 mt-1">
                  <span>🛵 {order.pilot}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              <span className="font-bold text-green-600">{order.total} ج</span>
            </div>
          ))}
          {archiveOrders.length === 0 && (
            <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>لا توجد بيانات</div>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-2">
          {archiveExpenses.map(exp => (
            <div key={exp.id} className={`${cardBg} border rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="font-bold">{exp.type}</span>
                <span className="text-sm text-gray-500 mr-3">{new Date(exp.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <span className="font-bold text-red-600">{exp.amount} ج</span>
            </div>
          ))}
          {archiveExpenses.length === 0 && (
            <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>لا توجد بيانات</div>
          )}
        </div>
      )}

      {(tab === 'complaints' || tab === 'returns') && (
        <div className="space-y-2">
          {(tab === 'complaints' ? archiveComplaints : archiveReturns).map(c => (
            <div key={c.id} className={`${cardBg} border rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === 'شكوى' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {c.type}
                </span>
                <span className="font-bold">{c.customerName}</span>
              </div>
              <p className="text-sm text-gray-500">{c.details}</p>
            </div>
          ))}
          {(tab === 'complaints' ? archiveComplaints : archiveReturns).length === 0 && (
            <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>لا توجد بيانات</div>
          )}
        </div>
      )}

      {tab === 'evaluations' && (
        <div className="space-y-2">
          {state.archive.evaluations.map(ev => (
            <div key={ev.id} className={`${cardBg} border rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">{ev.pilotName}</span>
                <span className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(ev.criteria).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ {k}</span>
                ))}
              </div>
            </div>
          ))}
          {state.archive.evaluations.length === 0 && (
            <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>لا توجد بيانات</div>
          )}
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-2">
          {state.customers.filter(c => !search || c.name.includes(search) || c.phone.includes(search)).map(c => (
            <div key={c.id} className={`${cardBg} border rounded-xl p-4 flex items-center justify-between`}>
              <div>
                <span className="font-bold">{c.name}</span>
                <span className="text-sm text-gray-500 mr-2">{c.phone}</span>
              </div>
              <div className="text-left">
                <span className="text-sm">{c.totalOrders} طلب</span>
                <span className="font-bold text-green-600 mr-2">{c.totalPaid} ج</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
