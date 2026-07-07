import React from 'react';
import { CATEGORY_CONFIG, type Incident } from '../data/incidents';
import { IconPin, IconCheck, IconChevronRight } from './Icons';

interface IncidentFeedProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (incident: Incident) => void;
}

const CategoryBadge: React.FC<{ category: Incident['category'] }> = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span
      className="badge"
      style={{ background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.borderColor}` }}
    >
      {cfg.label}
    </span>
  );
};

const IncidentCard: React.FC<{
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}> = ({ incident, isSelected, onClick }) => {
  const isCritical = incident.priority === 'critical';
  const isResolved = incident.status === 'resolved';

  return (
    <div
      className="incident-card cursor-pointer rounded-xl p-3 flex flex-col gap-2 fade-in transition-all duration-200"
      onClick={onClick}
      style={{
        background: isSelected ? 'var(--accent-dim)' : 'var(--bg-glass)',
        border: isSelected
          ? '1px solid var(--accent)'
          : isCritical
          ? '1px solid rgba(239,68,68,0.35)'
          : '1px solid var(--border-color)',
        boxShadow: isSelected ? '0 0 0 1px rgba(0,242,254,0.15), var(--shadow-card)' : 'none',
      }}
    >
      {/* Top: badges + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <CategoryBadge category={incident.category} />
          {isResolved && (
            <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
              <IconCheck size={10} color="#10B981" /> ВИРІШЕНО
            </span>
          )}
        </div>
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: isResolved ? '#10B981' : isCritical ? '#EF4444' : incident.status === 'processing' ? '#3B82F6' : '#F59E0B',
            boxShadow: `0 0 6px ${isResolved ? '#10B981' : isCritical ? '#EF4444' : '#3B82F6'}`,
          }}
        />
      </div>

      {/* Pulsing priority bar */}
      {isCritical && !isResolved && <div className="priority-bar" />}

      {/* Title */}
      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
        {incident.title}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
        <IconPin size={11} color="var(--text-muted)" />
        <span>{incident.complaintsCount} скарг</span>
        <span>·</span>
        <span>{incident.timeAgo}</span>
        <span>·</span>
        <span className="truncate">{incident.location}</span>
      </div>

      {/* Department */}
      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <IconChevronRight size={10} color="var(--accent)" />
        {incident.department}
      </div>
    </div>
  );
};

// Purely the list — no header (header is in Dashboard)
const IncidentFeed: React.FC<IncidentFeedProps> = ({ incidents, selectedId, onSelect }) => {
  const sorted = [...incidents].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    if (b.status === 'resolved' && a.status !== 'resolved') return -1;
    return order[a.priority] - order[b.priority];
  });

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
        <div style={{ color: 'var(--text-muted)', fontSize: 36 }}>🗺️</div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Немає інцидентів</p>
      </div>
    );
  }

  return (
    <>
      {sorted.map(incident => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          isSelected={selectedId === incident.id}
          onClick={() => onSelect(incident)}
        />
      ))}
    </>
  );
};

export default IncidentFeed;
