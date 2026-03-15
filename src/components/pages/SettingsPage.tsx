import { useState } from 'react';
import { useStore } from '../../store';
import { Plus, Trash2, X, Users, Timer, Building, Monitor, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole, Shift } from '../../types';

export default function SettingsPage() {
  const {
    state, currentUser, addUser, deleteUser, updateUser, addPilot, deletePilot,
    updateTimerSettings, updateBranchName, toggleDarkMode, darkMode, fontSize, setFontSize, toast,
  } = useStore();
  const [tab, setTab] = useState('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as UserRole, branch: 1, shift: 'صباحي' as Shift, responsibleName: '' });
  const [newPilot, setNewPilot] = useState('');
  const [timerForm, setTimerForm] = useState({ ...state.timerSettings });
  const [changePw, setChangePw] = useState({ old: '', new1: '', new2: '' });
  const [branchEdits, setBranchEdits] = useState<Record<number, string>>({ ...state.branches });
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bunduq_firebase_config') || 'null') || { apiKey: '', authDomain: '', databaseURL: '', projectId: '' }; }
    catch { return { apiKey: '', authDomain: '', databaseURL: '', projectId: '' }; }
  });

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const tabs = [
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'pilots', label: 'الطيارين', icon: Users },
    { id: 'timer', label: 'التايمر', icon: Timer },
    { id: 'branches', label: 'الفروع', icon: Building },
    { id: 'system', label: 'النظام', icon: Monitor },
    ...(isSuperAdmin ? [{ id: 'sync', label: 'المزامنة', icon: RefreshCw }] : []),
  ];

  const ROLE_LABELS: Record<string, string> = { superadmin: 'سوبر أدمن', admin: 'مدير', supervisor: 'مشرف', user: 'موظف' };
  const ROLE_COLORS: Record<string, string> = { superadmin: 'bg-red-100 text-red-700', admin: 'bg-purple-100 text-purple-700', supervisor: 'bg-blue-100 text-blue-700', user: 'bg-gray-100 text-gray-700' };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.users.find(u => u.username === newUser.username)) { toast('اسم المستخدم موجود بالفعل', 'error'); return; }
    addUser(newUser);
    setNewUser({ username: '', password: '', role: 'user', branch: 1, shift: 'صباحي', responsibleName: '' });
    setShowAddUser(false);
  };

  const handleChangePw = () => {
    if (!changePw.old || !changePw.new1) return;
    if (changePw.new1 !== changePw.new2) { toast('كلمتا المرور غير متطابقتين', 'error'); return; }
    if (currentUser && changePw.old !== currentUser.password) { toast('كلمة المرور الحالية غير صحيحة', 'error'); return; }
    if (currentUser) { updateUser(currentUser.id, { password: changePw.new1 }); setChangePw({ old: '', new1: '', new2: '' }); }
  };

  const handleSaveTimerSettings = () => {
    updateTimerSettings(timerForm);
  };

  const handleSaveBranches = () => {
    Object.entries(branchEdits).forEach(([k, v]) => updateBranchName(Number(k), v));
    toast('تم حفظ أسماء الفروع');
  };

  const saveFirebaseConfig = () => {
    localStorage.setItem('bunduq_firebase_config', JSON.stringify(firebaseConfig));
    toast('تم حفظ إعدادات Firebase — أعد تشغيل التطبيق');
  };

  const exportData = () => {
    const data = JSON.stringify(JSON.parse(localStorage.getItem('bunduq_state') || '{}'), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `بندق_نسخة_احتياطية_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (confirm('هل أنت متأكد من استيراد هذه البيانات؟ سيتم الكتابة فوق البيانات الحالية.')) {
          localStorage.setItem('bunduq_state', JSON.stringify(data));
          window.location.reload();
        }
      } catch { toast('ملف غير صالح', 'error'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">⚙️ الإعدادات</h1>

      {/* Tab buttons */}
      <div className={`${cardBg} border rounded-xl p-1 flex gap-1 flex-wrap`}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                ${tab === t.id ? 'bg-amber-500 text-white' : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">👥 إدارة المستخدمين</h2>
            {isAdmin && (
              <button onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold">
                <Plus size={16} /> مستخدم جديد
              </button>
            )}
          </div>
          <div className="space-y-3">
            {state.users.map(u => (
              <div key={u.id} className={`${cardBg} border rounded-xl p-4 flex items-center justify-between`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{u.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
                    <span>المسؤول: {u.responsibleName}</span>
                    <span>{state.branches[u.branch]}</span>
                    <span>{u.shift}</span>
                    <div className="flex items-center gap-1">
                      <span>كلمة المرور: {showPw[u.id] ? u.password : '••••••'}</span>
                      <button onClick={() => setShowPw(p => ({ ...p, [u.id]: !p[u.id] }))}>
                        {showPw[u.id] ? <EyeOff size={12} className="text-gray-400" /> : <Eye size={12} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>
                {isAdmin && u.id !== currentUser?.id && (
                  <button onClick={() => { if (confirm(`حذف ${u.username}؟`)) deleteUser(u.id); }}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add User Modal */}
          {showAddUser && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddUser(false)}>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md p-6`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">➕ مستخدم جديد</h2>
                  <button onClick={() => setShowAddUser(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleAddUser} className="space-y-3">
                  <input required placeholder="اسم المستخدم" value={newUser.username}
                    onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                  <input required placeholder="الاسم المسؤول" value={newUser.responsibleName}
                    onChange={e => setNewUser(u => ({ ...u, responsibleName: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                  <input required type="password" placeholder="كلمة المرور" value={newUser.password}
                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`} />
                  <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value as UserRole }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                    <option value="user">موظف</option>
                    <option value="supervisor">مشرف</option>
                    <option value="admin">مدير</option>
                    {isSuperAdmin && <option value="superadmin">سوبر أدمن</option>}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newUser.branch} onChange={e => setNewUser(u => ({ ...u, branch: Number(e.target.value) }))}
                      className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                      {Object.entries(state.branches).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={newUser.shift} onChange={e => setNewUser(u => ({ ...u, shift: e.target.value as Shift }))}
                      className={`w-full ${inputBg} border rounded-lg px-3 py-2`}>
                      <option value="صباحي">صباحي</option>
                      <option value="مسائي">مسائي</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold">
                    إضافة
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PILOTS TAB */}
      {tab === 'pilots' && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">🚗 إدارة الطيارين</h2>
          <div className={`${cardBg} border rounded-xl p-4 flex gap-3`}>
            <input value={newPilot} onChange={e => setNewPilot(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { addPilot(newPilot.trim()); setNewPilot(''); } }}
              placeholder="اسم الطيار الجديد..."
              className={`flex-1 ${inputBg} border rounded-lg px-3 py-2`} />
            <button onClick={() => { if (newPilot.trim()) { addPilot(newPilot.trim()); setNewPilot(''); } }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-bold">
              <Plus size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {state.pilots.map(p => (
              <div key={p} className={`${cardBg} border rounded-xl p-3 flex items-center justify-between`}>
                <span className="font-semibold">🚗 {p}</span>
                <button onClick={() => { if (confirm(`حذف ${p}؟`)) deletePilot(p); }}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMER TAB */}
      {tab === 'timer' && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">⏱ إعدادات التايمر</h2>
          <div className={`${cardBg} border rounded-2xl p-6`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'وقت التحذير (دقيقة)', key: 'warning', color: 'text-amber-600', desc: 'يتحول التايمر للأصفر بعد هذه المدة' },
                { label: 'وقت الخطر (دقيقة)', key: 'danger', color: 'text-red-600', desc: 'يتحول التايمر للأحمر بعد هذه المدة' },
                { label: 'الهدف المثالي (دقيقة)', key: 'target', color: 'text-green-600', desc: 'الوقت المستهدف للطلعة' },
              ].map(({ label, key, color, desc }) => (
                <div key={key}>
                  <label className={`block text-sm font-bold mb-1 ${color}`}>{label}</label>
                  <input type="number" min={1} max={120}
                    value={(timerForm as any)[key]}
                    onChange={e => setTimerForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-xl font-black`} />
                  <p className="text-xs text-gray-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>
            {/* Preview */}
            <div className="mt-6 flex gap-3 flex-wrap">
              {[
                { label: `0 → ${timerForm.warning} د`, color: 'bg-green-500', text: '✅ ممتاز' },
                { label: `${timerForm.warning} → ${timerForm.danger} د`, color: 'bg-amber-500', text: '⚠️ تحذير' },
                { label: `> ${timerForm.danger} د`, color: 'bg-red-500', text: '🚨 خطر' },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-2 ${s.color} text-white px-4 py-2 rounded-xl text-sm font-bold`}>
                  {s.text} ({s.label})
                </div>
              ))}
            </div>
            <button onClick={handleSaveTimerSettings}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-8 py-2.5 rounded-xl font-bold">
              💾 حفظ الإعدادات
            </button>
          </div>
        </div>
      )}

      {/* BRANCHES TAB */}
      {tab === 'branches' && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">🏢 أسماء الفروع</h2>
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {Object.entries(branchEdits).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>{k}</span>
                  <input value={v} onChange={e => setBranchEdits(b => ({ ...b, [Number(k)]: e.target.value }))}
                    className={`flex-1 ${inputBg} border rounded-lg px-3 py-2`} />
                </div>
              ))}
            </div>
            <button onClick={handleSaveBranches} className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2.5 rounded-xl font-bold">
              💾 حفظ الأسماء
            </button>
          </div>
        </div>
      )}

      {/* SYSTEM TAB */}
      {tab === 'system' && (
        <div className="space-y-4">
          {/* Appearance */}
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <h2 className="font-bold mb-4">🎨 المظهر</h2>
            <div className="flex flex-wrap gap-4 items-center">
              <button onClick={toggleDarkMode}
                className={`px-5 py-2.5 rounded-xl font-semibold border-2 transition-all ${darkMode ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-gray-300 hover:border-amber-400'}`}>
                {darkMode ? '🌙 وضع داكن (فعّال)' : '☀️ وضع فاتح (فعّال)'}
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">حجم الخط:</span>
                <input type="range" min={12} max={18} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                  className="w-32 accent-amber-500" />
                <span className="font-bold w-6">{fontSize}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <h2 className="font-bold mb-4">📈 إحصائيات النظام</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'الأوردرات', value: state.orders.length },
                { label: 'العملاء', value: state.customers.length },
                { label: 'الأرشيف', value: state.archive.orders.length },
                { label: 'المستخدمين', value: state.users.length },
                { label: 'الطيارين', value: state.pilots.length },
                { label: 'الطلعات', value: state.timers.length },
                { label: 'الشكاوى', value: state.complaints.length },
                { label: 'الحجوزات', value: (state.bookings || []).length },
              ].map(s => (
                <div key={s.label} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3 text-center`}>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="font-black text-lg">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Backup */}
          {isAdmin && (
            <div className={`${cardBg} border rounded-2xl p-5`}>
              <h2 className="font-bold mb-4">💾 نسخ احتياطي</h2>
              <div className="flex gap-3 flex-wrap">
                <button onClick={exportData}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold">
                  📤 تصدير البيانات (JSON)
                </button>
                <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold cursor-pointer">
                  📥 استيراد بيانات
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Change Password */}
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <h2 className="font-bold mb-4">🔑 تغيير كلمة المرور</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="password" placeholder="كلمة المرور الحالية" value={changePw.old}
                onChange={e => setChangePw(p => ({ ...p, old: e.target.value }))}
                className={`${inputBg} border rounded-lg px-3 py-2`} />
              <input type="password" placeholder="كلمة المرور الجديدة" value={changePw.new1}
                onChange={e => setChangePw(p => ({ ...p, new1: e.target.value }))}
                className={`${inputBg} border rounded-lg px-3 py-2`} />
              <input type="password" placeholder="تأكيد كلمة المرور" value={changePw.new2}
                onChange={e => setChangePw(p => ({ ...p, new2: e.target.value }))}
                className={`${inputBg} border rounded-lg px-3 py-2`} />
            </div>
            <button onClick={handleChangePw} className="mt-3 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-semibold">
              تغيير
            </button>
          </div>
        </div>
      )}

      {/* SYNC TAB — SuperAdmin only */}
      {tab === 'sync' && isSuperAdmin && (
        <div className="space-y-4">
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <h2 className="font-bold mb-2 flex items-center gap-2"><RefreshCw size={18} /> إعدادات Firebase (مزامنة السحابة)</h2>
            <p className="text-sm text-gray-500 mb-4">
              لتفعيل المزامنة التلقائية مع Firebase Realtime Database، أدخل بيانات المشروع هنا.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {[
                { label: 'API Key', key: 'apiKey' },
                { label: 'Auth Domain', key: 'authDomain' },
                { label: 'Database URL', key: 'databaseURL' },
                { label: 'Project ID', key: 'projectId' },
                { label: 'Storage Bucket', key: 'storageBucket' },
                { label: 'Messaging Sender ID', key: 'messagingSenderId' },
                { label: 'App ID', key: 'appId' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input value={(firebaseConfig as any)[key] || ''}
                    onChange={e => setFirebaseConfig((f: any) => ({ ...f, [key]: e.target.value }))}
                    placeholder={label}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 font-mono text-sm`} />
                </div>
              ))}
            </div>
            <button onClick={saveFirebaseConfig}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold">
              💾 حفظ إعدادات Firebase
            </button>
            <p className="text-xs text-gray-400 mt-3">
              ملاحظة: بعد الحفظ، أعد تشغيل التطبيق لتفعيل المزامنة.
              البيانات الحالية محفوظة في localStorage.
            </p>
          </div>

          {/* Branch path selector */}
          <div className={`${cardBg} border rounded-2xl p-5`}>
            <h2 className="font-bold mb-3">📁 مسار الفرع في Firebase</h2>
            <div className="flex gap-3">
              <select className={`flex-1 ${inputBg} border rounded-lg px-3 py-2`}>
                {Object.entries(state.branches).map(([k, v]) => (
                  <option key={k} value={`branches/branch_${k}`}>branch_{k} — {v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
