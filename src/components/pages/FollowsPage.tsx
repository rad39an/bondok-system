import { useState } from 'react';
import { useStore } from '../../store';
import { Plus, Search, Edit2, Trash2, Send, FileText, MoreVertical, X, Printer } from 'lucide-react';
import { Order, OrderSource, OrderStatus, Shift } from '../../types';

export default function FollowsPage() {
  const { state, currentUser, addOrder, updateOrder, deleteOrder, updateCustomerOrders, findCustomerByPhone, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState('');
  const [filterPilot, setFilterPilot] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Form state
  const [form, setForm] = useState({
    customerName: '', phone: '', address: '', pilot: '', receiver: '',
    shift: (currentUser?.shift || 'صباحي') as Shift, branch: currentUser?.branch || 1,
    orderValue: 0, deliveryFee: 0, details: '',
    source: 'واتساب' as OrderSource, status: 'جديد' as OrderStatus,
  });

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const resetForm = () => {
    setForm({
      customerName: '', phone: '', address: '', pilot: '', receiver: '',
      shift: (currentUser?.shift || 'صباحي') as Shift, branch: currentUser?.branch || 1,
      orderValue: 0, deliveryFee: 0, details: '',
      source: 'واتساب', status: 'جديد',
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  const handlePhoneChange = (phone: string) => {
    setForm(f => ({ ...f, phone }));
    if (phone.length >= 8) {
      const customer = findCustomerByPhone(phone);
      if (customer) {
        setForm(f => ({ ...f, customerName: customer.name, address: customer.address }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phone) return;
    const total = form.orderValue + form.deliveryFee;
    if (editingOrder) {
      updateOrder(editingOrder.id, { ...form, total });
    } else {
      addOrder({ ...form, total, createdBy: currentUser?.responsibleName || '' });
      updateCustomerOrders(form.phone, form.customerName, form.address, total);
    }
    resetForm();
  };

  const startEdit = (order: Order) => {
    setForm({
      customerName: order.customerName, phone: order.phone, address: order.address,
      pilot: order.pilot, receiver: order.receiver, shift: order.shift, branch: order.branch,
      orderValue: order.orderValue, deliveryFee: order.deliveryFee, details: order.details,
      source: order.source, status: order.status,
    });
    setEditingOrder(order);
    setShowForm(true);
    setMenuOpen(null);
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'جديد': return 'bg-blue-100 text-blue-700';
      case 'منتظم': return 'bg-green-100 text-green-700';
      case 'مخلص': return 'bg-purple-100 text-purple-700';
      case 'نجمة': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-700';
      case 'قيد التنفيذ': return 'bg-amber-100 text-amber-700';
      case 'مكتمل': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filtered = state.orders.filter(o => {
    if (search && !o.customerName.includes(search) && !o.phone.includes(search)) return false;
    if (filterPilot && o.pilot !== filterPilot) return false;
    if (filterBranch && o.branch !== Number(filterBranch)) return false;
    if (filterShift && o.shift !== filterShift) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    totalAmount: filtered.reduce((s, o) => s + o.total, 0),
    new: filtered.filter(o => o.status === 'جديد').length,
    inProgress: filtered.filter(o => o.status === 'قيد التنفيذ').length,
    completed: filtered.filter(o => o.status === 'مكتمل').length,
  };

  const sendWhatsApp = (order: Order) => {
    const msg = `مرحباً ${order.customerName}، طلبك قيد التجهيز.\nالتفاصيل: ${order.details}\nالإجمالي: ${order.total} ج`;
    window.open(`https://wa.me/${order.phone}?text=${encodeURIComponent(msg)}`, '_blank');
    setMenuOpen(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">📋 المتابعة</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
          <Plus size={18} /> أوردر جديد
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الأوردرات', value: stats.total, color: 'text-blue-600', bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
          { label: 'إجمالي المبالغ', value: `${stats.totalAmount} ج`, color: 'text-green-600', bg: darkMode ? 'bg-green-900/30' : 'bg-green-50' },
          { label: 'جديد', value: stats.new, color: 'text-amber-600', bg: darkMode ? 'bg-amber-900/30' : 'bg-amber-50' },
          { label: 'مكتمل', value: stats.completed, color: 'text-emerald-600', bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${cardBg} rounded-xl p-4 border flex flex-wrap gap-3`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="بحث بالاسم أو الموبايل..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full ${inputBg} border rounded-lg py-2 pr-10 pl-4`} />
        </div>
        <select value={filterPilot} onChange={e => setFilterPilot(e.target.value)}
          className={`${inputBg} border rounded-lg px-3 py-2`}>
          <option value="">كل الطيارين</option>
          {state.pilots.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
          className={`${inputBg} border rounded-lg px-3 py-2`}>
          <option value="">كل الفروع</option>
          {Object.entries(state.branches).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterShift} onChange={e => setFilterShift(e.target.value)}
          className={`${inputBg} border rounded-lg px-3 py-2`}>
          <option value="">كل الشيفتات</option>
          <option value="صباحي">صباحي</option>
          <option value="مسائي">مسائي</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>
            <p className="text-4xl mb-3">📭</p>
            <p>لا توجد أوردرات حالياً</p>
          </div>
        ) : filtered.map(order => {
          const customer = findCustomerByPhone(order.phone);
          return (
            <div key={order.id} className={`${cardBg} border rounded-xl p-4 hover:shadow-md transition-shadow animate-slide-in`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-lg">{order.customerName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                    {customer && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(customer.badge)}`}>
                        {customer.badge === 'نجمة' ? '⭐ ' : ''}{customer.badge}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{order.source}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500 mt-2">
                    <span>📱 {order.phone}</span>
                    <span>📍 {order.address || '—'}</span>
                    <span>🛵 {order.pilot || '—'}</span>
                    <span>🏢 {state.branches[order.branch]}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="font-semibold text-green-600">{order.total} ج</span>
                    <span className="text-gray-400">({order.orderValue} + {order.deliveryFee} توصيل)</span>
                    <span className="text-gray-400">{order.shift}</span>
                  </div>
                  {order.details && <p className="text-sm text-gray-500 mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">{order.details}</p>}
                </div>
                <div className="relative">
                  <button onClick={() => setMenuOpen(menuOpen === order.id ? null : order.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <MoreVertical size={18} />
                  </button>
                  {menuOpen === order.id && (
                    <div className={`absolute left-0 top-10 ${darkMode ? 'bg-gray-700' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-xl shadow-xl py-2 min-w-[160px] z-20`}>
                      <button onClick={() => startEdit(order)} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                        <Edit2 size={14} /> تعديل
                      </button>
                      <button onClick={() => sendWhatsApp(order)} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-green-600">
                        <Send size={14} /> واتساب
                      </button>
                      <button onClick={() => { setInvoiceOrder(order); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                        <FileText size={14} /> الفاتورة
                      </button>
                      <button onClick={() => { deleteOrder(order.id); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-red-500">
                        <Trash2 size={14} /> حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingOrder ? '✏️ تعديل الأوردر' : '➕ أوردر جديد'}</h2>
              <button onClick={resetForm} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم العميل *</label>
                  <input type="text" required value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم الموبايل *</label>
                  <input type="text" required value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">العنوان</label>
                  <input type="text" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الطيار</label>
                  <select value={form.pilot} onChange={e => setForm(f => ({ ...f, pilot: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                    <option value="">اختر الطيار</option>
                    {state.pilots.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المستلم</label>
                  <input type="text" value={form.receiver}
                    onChange={e => setForm(f => ({ ...f, receiver: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">جهة الطلب</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as OrderSource }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                    <option value="واتساب">واتساب</option>
                    <option value="تليفون">تليفون</option>
                    <option value="حضوري">حضوري</option>
                    <option value="تطبيق">تطبيق</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">قيمة الأوردر (ج)</label>
                  <input type="number" min={0} value={form.orderValue}
                    onChange={e => setForm(f => ({ ...f, orderValue: Number(e.target.value) }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">قيمة التوصيل (ج)</label>
                  <input type="number" min={0} value={form.deliveryFee}
                    onChange={e => setForm(f => ({ ...f, deliveryFee: Number(e.target.value) }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الإجمالي (ج)</label>
                  <div className={`${inputBg} border rounded-lg px-3 py-2 font-bold text-green-600`}>
                    {form.orderValue + form.deliveryFee} ج
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as OrderStatus }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                    <option value="جديد">جديد</option>
                    <option value="قيد التنفيذ">قيد التنفيذ</option>
                    <option value="مكتمل">مكتمل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الفرع</label>
                  <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: Number(e.target.value) }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                    {Object.entries(state.branches).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الشيفت</label>
                  <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value as Shift }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                    <option value="صباحي">صباحي</option>
                    <option value="مسائي">مسائي</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تفاصيل الطلب</label>
                <textarea rows={3} value={form.details}
                  onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={resetForm}
                  className="px-6 py-2 border rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">إلغاء</button>
                <button type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold">
                  {editingOrder ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInvoiceOrder(null)}>
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold">🥜 فاتورة بندق</h2>
              <p className="text-sm text-gray-500">{new Date(invoiceOrder.createdAt).toLocaleString('ar-EG')}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>العميل:</span><span className="font-bold">{invoiceOrder.customerName}</span></div>
              <div className="flex justify-between"><span>الموبايل:</span><span>{invoiceOrder.phone}</span></div>
              <div className="flex justify-between"><span>العنوان:</span><span>{invoiceOrder.address || '—'}</span></div>
              <div className="flex justify-between"><span>الطيار:</span><span>{invoiceOrder.pilot || '—'}</span></div>
              <div className="flex justify-between"><span>الفرع:</span><span>{state.branches[invoiceOrder.branch]}</span></div>
              <hr />
              <div className="flex justify-between"><span>قيمة الأوردر:</span><span>{invoiceOrder.orderValue} ج</span></div>
              <div className="flex justify-between"><span>التوصيل:</span><span>{invoiceOrder.deliveryFee} ج</span></div>
              <hr />
              <div className="flex justify-between text-lg font-bold"><span>الإجمالي:</span><span className="text-green-600">{invoiceOrder.total} ج</span></div>
            </div>
            {invoiceOrder.details && <div className="mt-3 p-2 bg-gray-50 rounded text-sm">{invoiceOrder.details}</div>}
            <div className="flex gap-3 mt-6 justify-center">
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl">
                <Printer size={16} /> طباعة
              </button>
              <button onClick={() => setInvoiceOrder(null)} className="px-4 py-2 border rounded-xl hover:bg-gray-50">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
