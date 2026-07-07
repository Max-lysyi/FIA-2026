import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfileView: React.FC = () => {
  const { user, loginSimulate, logoutSimulate } = useAuth();
  const [nameInput, setNameInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      loginSimulate(nameInput.trim());
    }
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-8 md:px-12 md:py-10 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Мій акаунт</h1>
          <p className="text-sm opacity-75" style={{ color: 'var(--text-secondary)' }}>
            Керуйте своїми балами еко-активіста та переглядайте історію повідомлень
          </p>
        </div>

        {!user?.isLoggedIn ? (
          /* Login Form */
          <div className="glass-card p-8 rounded-3xl border max-w-md mx-auto w-full flex flex-col gap-6" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-center">
              <h2 className="text-xl font-bold">Вхід у кабінет</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Авторизуйтеся, щоб накопичувати бали за звіти про проблеми
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Ім'я користувача</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Олександр Коваль"
                  className="px-4 py-2.5 rounded-xl text-sm outline-none border bg-[var(--bg-secondary)]"
                  style={{ borderColor: 'var(--border-color-strong)' }}
                />
              </div>

              <button type="submit" className="btn-neon w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                Авторизуватися
              </button>
            </form>

            <div className="flex items-center my-1">
              <div className="flex-1 h-[1px]" style={{ background: 'var(--border-color)' }} />
              <span className="text-[10px] uppercase font-bold px-3" style={{ color: 'var(--text-muted)' }}>Або</span>
              <div className="flex-1 h-[1px]" style={{ background: 'var(--border-color)' }} />
            </div>

            <button
              onClick={() => loginSimulate('Гість Google')}
              className="w-full py-3 rounded-xl text-xs font-bold border transition-all hover:bg-[var(--bg-glass-hover)]"
              style={{ borderColor: 'var(--border-color-strong)' }}
            >
              🔑 Увійти через Google
            </button>
          </div>
        ) : (
          /* User Profile Dashboard */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* User Info & Points Card */}
            <div className="glass-card p-6 rounded-2xl border flex flex-col gap-5 md:col-span-1" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white bg-gradient-to-r from-teal-400 to-indigo-500">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold">{user.name}</h3>
                  <span className="text-xs text-emerald-400">● Активний громадянин</span>
                </div>
              </div>

              {/* Total points */}
              <div className="p-4 rounded-xl text-center bg-[var(--bg-secondary)] border" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-3xl font-extrabold text-cyan-400">{user.points}</span>
                <span className="text-xs block mt-1" style={{ color: 'var(--text-muted)' }}>Бали еко-активіста</span>
              </div>

              {/* Stats info */}
              <div className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Подано скарг:</span>
                  <span className="font-bold text-[var(--text-primary)]">{(user.history.length - 1) || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span>Рейтинг міста:</span>
                  <span className="font-bold text-[var(--text-primary)]">ТОП-15 активістів</span>
                </div>
              </div>

              <button
                onClick={logoutSimulate}
                className="w-full py-2.5 mt-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                Вийти з акаунту
              </button>
            </div>

            {/* Points History Card */}
            <div className="glass-card p-6 rounded-2xl border flex flex-col gap-4 md:col-span-2" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-base font-bold">🏆 Нарахування балів активності</h3>
              
              <div className="flex flex-col gap-3 overflow-y-auto max-h-80">
                {user.history.map((h, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-secondary)] border"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{h.reason}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{h.date}</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400">+{h.points} балів</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
