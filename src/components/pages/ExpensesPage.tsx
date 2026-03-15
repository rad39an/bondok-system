import { useState } from 'react';
import { useStore } from '../../store';
import { Plus, Trash2 } from 'lucide-react';

export default function ExpensesPage() {
  const { state, currentUser, addExpense, deleteExpense, darkMode } = useStore();
  const [type, setType] = useState('');
  const [amount, setAmount] = useState(0);

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !amount) return;
    addExpense({ type, amount, date: new Date().toISOString(), createdBy: currentUser?.responsibleName || '' });
    setType(''); setAmount(0);
  };

  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">💰 المصروفات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${darkMode ? 'bg-red-900/30' : 'bg-red-50'} rounded-xl p-4 border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
          <p className="text-sm text-gray-500">إجمالي المصروفات</p>
          <p className="text-3xl font-bold text-red-600">{totalExpenses} ج</p>
        </div>
        <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl p-4 border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
          <p className="text-sm text-gray-500">عدد المصروفات</p>
          <p className="text-3xl font-bold text-blue-600">{state.expenses.length}</p>
        </div>
      </div>

      <div className={`${cardBg} border rounded-xl p-5`}>
        <h2 className="font-bold mb-4">➕ تسجيل مصروف جديد</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
          <input type="text" required placeholder="نوع المصروف" value={type}
            onChange={e => setType(e.target.value)}
            className={`flex-1 min-w-[200px] ${inputBg} border rounded-lg px-3 py-2`} />
          <input type="number" required min={1} placeholder="المبلغ (ج)" value={amount || ''}
            onChange={e => setAmount(Number(e.target.value))}
            className={`w-40 ${inputBg} border rounded-lg px-3 py-2`} />
          <button type="submit"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-semibold">
            <Plus size={18} /> إضافة
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {state.expenses.length === 0 ? (
          <div className={`${cardBg} border rounded-xl p-12 text-center text-gray-500`}>
            <p className="text-4xl mb-3">🧾</p>
            <p>لا توجد مصروفات مسجلة</p>
          </div>
        ) : state.expenses.map(exp => (
          <div key={exp.id} className={`${cardBg} border rounded-xl p-4 flex items-center justify-between`}>
            <div>
              <span className="font-bold">{exp.type}</span>
              <span className="text-sm text-gray-500 mr-3">{new Date(exp.date).toLocaleString('ar-EG')}</span>
              <span className="text-xs text-gray-400 mr-2">بواسطة: {exp.createdBy}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-red-600 text-lg">{exp.amount} ج</span>
              <button onClick={() => deleteExpense(exp.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
