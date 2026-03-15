import { useEffect, useState } from 'react';

interface Props {
  userName: string;
  onComplete: () => void;
}

export default function WelcomeScreen({ userName, onComplete }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1600),
      setTimeout(() => onComplete(), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
      <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} text-7xl mb-4`}>
        🥜
      </div>
      <div className={`transition-all duration-500 delay-200 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} text-center`}>
        <h1 className="text-3xl font-black text-amber-400 mb-1">أهلاً، {userName}!</h1>
        <p className="text-slate-400">نظام بندق</p>
      </div>
      <div className={`transition-all duration-500 delay-500 ${step >= 3 ? 'opacity-100' : 'opacity-0'} mt-6`}>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
