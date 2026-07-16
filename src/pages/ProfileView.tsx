import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const rankSuffix = (n: number) => {
  if (n === 1) return '-му';
  if (n >= 2 && n <= 4) return '-му';
  return '-му';
};

const ProfileView: React.FC = () => {
  const { user, loginSimulate, logoutSimulate, getUserRank } = useAuth();
  const [nameInput, setNameInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) loginSimulate(nameInput.trim());
  };

  return (
    <div className="cs-scroll-page">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="cs-page-title">Мій акаунт</h1>
        <p className="cs-page-subtitle">Керуйте балами еко-активіста та переглядайте історію повідомлень</p>

        {!user?.isLoggedIn ? (
          <div className="cs-login-card">
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Вхід у кабінет</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Авторизуйтеся, щоб накопичувати бали за звіти про проблеми
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="cs-form-label">Ім'я користувача</label>
                <input
                  className="cs-form-input"
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Олександр Коваль"
                />
              </div>
              <button type="submit" className="cs-btn-neon" style={{ width: '100%' }}>
                Авторизуватися
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Або</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            <button
              onClick={() => loginSimulate('Гість Google')}
              className="cs-btn-ghost"
              style={{ width: '100%' }}
            >
              🔑 Увійти через Google
            </button>
          </div>
        ) : (
          <div className="cs-profile-grid">
           
            

            {/* Left: avatar & stats */}
            <div className="cs-profile-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="cs-profile-avatar">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{user.name}</h3>
                  <span style={{ fontSize: 12, color: '#10B981' }}>● Активний громадянин</span>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: 16, textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--accent)' }}>{user.points}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Бали еко-активіста</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Подано скарг:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.max(user.history.length - 1, 3)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Рейтинг міста:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>ТОП-{getUserRank()}</span>
                </div>
              </div>

              <button
                onClick={logoutSimulate}
                style={{
                  width: '100%', padding: '10px', borderRadius: 12,
                  fontSize: 12, fontWeight: 600,
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444', background: 'transparent', cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                Вийти з акаунту
              </button>
            </div>

            {/* Right: history */}
            <div className="cs-profile-card">
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>🏆 Нарахування балів активності</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 320 }}>
                {user.history.map((h, i) => (
                  <div key={i} className="cs-history-item">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.reason}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.date}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#10B981', flexShrink: 0 }}>+{h.points} б</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="cs-rank-banner" style={{ gridColumn: '1 / -1' }}>
              <div className="cs-rank-banner__icon">🏆</div>
              <div>
                <div className="cs-rank-banner__title">
                  Ви на {getUserRank()}{rankSuffix(getUserRank())} місці в топі активістів міста!
                </div>
                <div className="cs-rank-banner__sub">
                  Зберіть більше балів, подаючи звіти про проблеми
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
