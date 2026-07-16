import React, { useState, useMemo } from 'react';
import { useAuth, type MockUser } from '../context/AuthContext';

const INITIAL_SHOW = 5;
const EXPANDED_SHOW = 15;

const medalEmoji = (pos: number) => {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return `${pos}`;
};

const Leaderboard: React.FC = () => {
  const { user, getMockUsers, getUserRank } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const sortedAll = useMemo(() => {
    const mocks = getMockUsers();
    const all: (MockUser & { isCurrent?: boolean })[] = mocks.map(m => ({ ...m, isCurrent: false }));

    if (user?.isLoggedIn) {
      all.push({
        id: 'current',
        name: user.name,
        points: user.points,
        avatar: user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        isCurrent: true,
      });
    }

    all.sort((a, b) => b.points - a.points);
    return all;
  }, [getMockUsers, user]);

  const limit = expanded ? EXPANDED_SHOW : INITIAL_SHOW;
  const visible = sortedAll.slice(0, limit);
  const userRank = getUserRank();
  const currentInVisible = visible.some(u => u.isCurrent);
  const currentUser = sortedAll.find(u => u.isCurrent);

  return (
    <div className="cs-glass-card cs-leaderboard" style={{ padding: 24, marginTop: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        🏆 ТОП Еко-активістів міста
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header row */}
        <div className="cs-lb-header">
          <span style={{ width: 40, textAlign: 'center' }}>#</span>
          <span style={{ flex: 1 }}>Ім'я</span>
          <span style={{ width: 90, textAlign: 'right' }}>Бали</span>
        </div>

        {/* Visible rows */}
        {visible.map((u, i) => {
          const pos = i + 1;
          const isTop3 = pos <= 3;
          return (
            <div
              key={u.id}
              className={`cs-lb-row ${u.isCurrent ? 'cs-lb-row--current' : ''} ${isTop3 ? 'cs-lb-row--top3' : ''}`}
            >
              <span className="cs-lb-pos" data-top3={isTop3 || undefined}>
                {medalEmoji(pos)}
              </span>
              <div className="cs-lb-avatar" style={{ background: u.isCurrent ? 'var(--accent)' : `hsl(${(pos * 47) % 360}, 50%, 40%)` }}>
                {u.avatar}
              </div>
              <span className="cs-lb-name">{u.name}</span>
              <span className="cs-lb-points" style={{ color: isTop3 ? '#F59E0B' : u.isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                {u.points} б
              </span>
            </div>
          );
        })}
      </div>

      {/* Show more / less */}
      {sortedAll.length > INITIAL_SHOW && (
        <button
          className="cs-lb-toggle"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? '▲ Згорнути' : `▼ Показати більше (до ${Math.min(EXPANDED_SHOW, sortedAll.length)})`}
        </button>
      )}

      {/* Pinned current user row (only when not visible in top) */}
      {user?.isLoggedIn && !currentInVisible && currentUser && (
        <div className="cs-lb-pinned">
          <div className="cs-lb-pinned__divider">
            <span>···</span>
          </div>
          <div className="cs-lb-row cs-lb-row--current cs-lb-row--pinned-row">
            <span className="cs-lb-pos">{userRank}</span>
            <div className="cs-lb-avatar" style={{ background: 'var(--accent)' }}>
              {currentUser.avatar}
            </div>
            <span className="cs-lb-name">{currentUser.name} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(Ви)</span></span>
            <span className="cs-lb-points" style={{ color: 'var(--accent)' }}>{currentUser.points} б</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
