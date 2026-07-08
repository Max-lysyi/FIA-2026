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
      className={`cs-incident-card${isSelected ? ' cs-incident-card--selected' : ''}${!isSelected && isCritical ? ' cs-incident-card--critical' : ''} fade-in`}
      onClick={onClick}
    >
      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <CategoryBadge category={incident.category} />
          {isResolved && (
            <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
              <IconCheck size={10} color="#10B981" /> ВИРІШЕНО
            </span>
          )}
        </div>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flexShrink: 0,
            background: isResolved ? '#10B981' : isCritical ? '#EF4444' : incident.status === 'processing' ? '#3B82F6' : '#F59E0B',
            boxShadow: `0 0 6px ${isResolved ? '#10B981' : isCritical ? '#EF4444' : '#3B82F6'}`,
          }}
        />
      </div>

      {/* Priority bar */}
      {isCritical && !isResolved && <div className="priority-bar" />}

      {/* Title */}
      <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: 'var(--text-primary)' }}>
        {incident.title}
      </p>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap', color: 'var(--text-muted)' }}>
        <IconPin size={11} color="var(--text-muted)" />
        <span>{incident.complaintsCount} скарг</span>
        <span>·</span>
        <span>{incident.timeAgo}</span>
        <span>·</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{incident.location}</span>
      </div>

      {/* Department */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
        <IconChevronRight size={10} color="var(--accent)" />
        {incident.department}
      </div>
    </div>
  );
};

const IncidentFeed: React.FC<IncidentFeedProps> = ({ incidents, selectedId, onSelect }) => {
  const sorted = [...incidents].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    if (b.status === 'resolved' && a.status !== 'resolved') return -1;
    return order[a.priority] - order[b.priority];
  });

  if (sorted.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 36 }}>🗺️</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Немає інцидентів</p>
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
