import { useState } from 'react';
import { useStore } from '../../store';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';

export default function ComplaintsPage() {
  const { state, currentUser, addComplaint, deleteComplaint, findCustomerByPhone, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'شكوى' | 'مرتجع'>('شكوى');
  const [form, setForm] = useState({
    customerPhone: '', customerName: '', pilot: '', details: '', returnCount: 0,
  });

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const handlePhoneChange = (phone: string) => {
    setForm(f => ({ ...f, customerPhone: phone }));
    if (phone.length >= 8) {
      const c = findCustomerByPhone(phone);
      if (c) setForm(f => ({ ...f, customerName: c.name }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addComplaint({
      type: formType,
      customerPhone: form.customerPhone,
      customerName: form.customerName,
      pilot: form.pilot,
      responsible: currentUser?.responsibleName || '',
      details: form.details,
      returnCount: formType === 'مرتجع' ? form.returnCount : undefined,
      date: new Date().toISOString(),
      createdBy: currentUser?.responsibleName || '',
    });
    setForm({ customerPhone: '', customerName: '', pilot: '', details: '', returnCount: 0 });
    setShowForm(false);
  };

  const complaints = state.complaints.filter(c => c.type === 'شكوى');
  const returns = state.complaints.filter(c => c.type === 'مرتجع');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">⚠️ الشكاوى والمرتجعات</h1>
        <div className="flex gap-2">
          <button onClick={() => { setFormType('شكوى'); setShowForm(true); }}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl">
            <AlertTriangle size={16} /> شكوى جديدة
          </button>
          <button onClick={() => { setFormType('مرتجع'); setShowForm(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl">
            <RotateCcw size={16} /> مرتجع جديد
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${darkMode ? 'bg-red-900/30' : 'bg-red-50'} rounded-xl p-4 border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
          <p className="text-sm text-gray-500">الشكاوى</p>
          <p className="text-3xl font-bold text-red-600">{complaints.length}</p>
        </div>
        <div className={`${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} rounded-xl p-4 border ${darkMode ? 'border-amber-800' : 'border-amber-200'}`}>
          <p className="text-sm text-gray-500">المرتجعات</p>
          <p className="text-3xl font-bold text-amber-600">{returns.length}</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {state.complaints.length === 0 ? (
          <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>
            <p className="text-4xl mb-3">✅</p>
            <p>لا توجد شكاوى أو مرتجعات</p>
          </div>
        ) : state.complaints.map(c => (
          <div key={c.id} className={`${cardBg} border rounded-xl p-4`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === 'شكوى' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {c.type}
                  </span>
                  <span className="font-bold">{c.customerName}</span>
                  {c.returnCount && <span className="text-xs text-gray-500">({c.returnCount} قطعة)</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{c.details}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>🛵 {c.pilot}</span>
                  <span>👤 {c.responsible}</span>
                  <span>📅 {new Date(c.date).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              <button onClick={() => deleteComplaint(c.id)}
                className="text-red-500 hover:bg-red-50 p-1 rounded text-sm">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md p-6`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{formType === 'شكوى' ? '⚠️ تسجيل شكوى' : '🔄 تسجيل مرتجع'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="رقم العميل (اختياري)" value={form.customerPhone}
                onChange={e => handlePhoneChange(e.target.value)}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              <input type="text" required placeholder="اسم العميل" value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              <select value={form.pilot} onChange={e => setForm(f => ({ ...f, pilot: e.target.value }))}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                <option value="">اختر الطيار</option>
                {state.pilots.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {formType === 'مرتجع' && (
                <input type="number" min={1} placeholder="عدد القطع المرتجعة" value={form.returnCount || ''}
                  onChange={e => setForm(f => ({ ...f, returnCount: Number(e.target.value) }))}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              )}
              <textarea required rows={3} placeholder="التفاصيل" value={form.details}
                onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
              <button type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold">
                تسجيل
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
