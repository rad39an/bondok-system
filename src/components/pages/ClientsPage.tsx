import { useState, useRef } from 'react';
import { useStore } from '../../store';
import { Search, Upload, Printer, X, UserCircle } from 'lucide-react';
import { Customer } from '../../types';

export default function ClientsPage() {
  const { state, importCustomers, darkMode } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const filtered = state.customers.filter(c =>
    c.name.includes(search) || c.phone.includes(search)
  );

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'جديد': return 'bg-blue-100 text-blue-700';
      case 'منتظم': return 'bg-green-100 text-green-700';
      case 'مخلص': return 'bg-purple-100 text-purple-700';
      case 'نجمة': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportProgress(0);

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      const customers = rows.map((row, i) => {
        setImportProgress(Math.round((i / rows.length) * 100));
        return {
          name: row['الاسم'] || row['name'] || '',
          phone: String(row['الموبايل'] || row['phone'] || ''),
          address: row['العنوان'] || row['address'] || '',
          firstOrderDate: new Date().toISOString(),
          totalOrders: Number(row['عدد_الطلبات'] || row['orders'] || 0),
          totalPaid: Number(row['إجمالي_المدفوع'] || row['paid'] || 0),
        };
      }).filter(c => c.name && c.phone);

      importCustomers(customers);
      setImportProgress(100);
    } catch {
      // handle error
    } finally {
      setTimeout(() => {
        setImporting(false);
        setImportProgress(0);
      }, 1000);
    }
  };

  const customerOrders = selectedCustomer
    ? state.orders.filter(o => o.phone === selectedCustomer.phone)
      .concat(state.archive.orders.filter(o => o.phone === selectedCustomer.phone))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserCircle size={24} /> العملاء</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl">
            <Upload size={16} /> استيراد Excel
          </button>
        </div>
      </div>

      {/* Import Progress */}
      {importing && (
        <div className={`${cardBg} border rounded-xl p-4`}>
          <p className="text-sm mb-2">جاري الاستيراد... {importProgress}%</p>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${importProgress}%` }} />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 text-gray-400" size={18} />
        <input type="text" placeholder="بحث بالاسم أو الموبايل..." value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full ${inputBg} border rounded-xl py-3 pr-10 pl-4`} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl p-3 border ${darkMode ? 'border-blue-800' : 'border-blue-200'} text-center`}>
          <p className="text-xs text-gray-500">إجمالي العملاء</p>
          <p className="text-2xl font-bold text-blue-600">{state.customers.length}</p>
        </div>
        {['جديد', 'منتظم', 'مخلص', 'نجمة'].map(badge => (
          <div key={badge} className={`${cardBg} border rounded-xl p-3 text-center`}>
            <p className="text-xs text-gray-500">{badge}</p>
            <p className="text-xl font-bold">{state.customers.filter(c => c.badge === badge).length}</p>
          </div>
        ))}
      </div>

      {/* Customers List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>
            <p className="text-4xl mb-3">👥</p>
            <p>لا يوجد عملاء</p>
          </div>
        ) : filtered.map(customer => (
          <div key={customer.id} className={`${cardBg} border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => setSelectedCustomer(customer)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{customer.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(customer.badge)}`}>
                      {customer.badge === 'نجمة' ? '⭐ ' : ''}{customer.badge}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{customer.phone}</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">{customer.totalOrders} طلب</p>
                <p className="font-bold text-green-600">{customer.totalPaid} ج</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">👤 {selectedCustomer.name}</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Printer size={18} />
                </button>
                <button onClick={() => setSelectedCustomer(null)}><X size={20} /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">الموبايل:</span><span>{selectedCustomer.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">العنوان:</span><span>{selectedCustomer.address || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">التصنيف:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getBadgeColor(selectedCustomer.badge)}`}>{selectedCustomer.badge}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">أول طلب:</span><span>{new Date(selectedCustomer.firstOrderDate).toLocaleDateString('ar-EG')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">إجمالي الطلبات:</span><span className="font-bold">{selectedCustomer.totalOrders}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">إجمالي المدفوع:</span><span className="font-bold text-green-600">{selectedCustomer.totalPaid} ج</span></div>
            </div>
            {customerOrders.length > 0 && (
              <>
                <h3 className="font-bold mb-2">📋 سجل الطلبات</h3>
                <div className="space-y-2">
                  {customerOrders.map(o => (
                    <div key={o.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-sm`}>
                      <div className="flex justify-between">
                        <span>{new Date(o.createdAt).toLocaleDateString('ar-EG')}</span>
                        <span className="font-bold text-green-600">{o.total} ج</span>
                      </div>
                      {o.details && <p className="text-gray-500 text-xs mt-1">{o.details}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
