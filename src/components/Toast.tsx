import { useStore } from '../store';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Toast() {
  const { toasts } = useStore();
  return (
    <div className="fixed bottom-4 left-4 z-[99998] space-y-2">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white font-semibold text-sm animate-slide-in max-w-xs
            ${t.type === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>
          {t.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} className="text-green-400" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
