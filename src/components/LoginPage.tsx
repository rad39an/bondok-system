import { useState } from 'react';
import { useStore } from '../store';

interface Props { onLogin: () => void; }

export default function LoginPage({ onLogin }: Props) {
  const { login, darkMode, toggleDarkMode } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const user = login(username.trim(), password.trim());
    setLoading(false);
    if (user) {
      onLogin();
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-amber-50 to-orange-100'} p-4`}>
      <div className={`w-full max-w-sm`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🥜</div>
          <h1 className={`text-3xl font-black ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>نظام بندق</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>V21 — نظام إدارة التوصيل</p>
        </div>

        {/* Card */}
        <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-xl`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                اسم المستخدم
              </label>
              <input
                type="text" required autoFocus
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors
                  ${darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-amber-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-400'
                  } outline-none`}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                كلمة المرور
              </label>
              <input
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors
                  ${darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-amber-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-400'
                  } outline-none`}
              />
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 text-sm font-medium px-4 py-3 rounded-xl border border-red-200">
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-xl font-black text-white transition-all
                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 active:scale-95'}`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الدخول...
                </span>
              ) : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        {/* Demo creds */}
        <div className={`mt-4 p-3 rounded-xl text-xs text-center ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white/70 text-gray-500'}`}>
          <p className="font-bold mb-1">بيانات التجربة:</p>
          <p>admin / admin123 · supervisor1 / 123456 · user1 / 123456</p>
        </div>

        <button onClick={toggleDarkMode} className={`mt-3 w-full text-center text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'} hover:text-amber-500`}>
          {darkMode ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن'}
        </button>
      </div>
    </div>
  );
}
