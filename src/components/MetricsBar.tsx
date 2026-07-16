import React from 'react';
import { IconAI, IconWarning } from './Icons';
import type { Incident } from '../data/incidents';

interface MetricsBarProps {
  incidents: Incident[];
  compact?: boolean;
}

const MetricsBar: React.FC<MetricsBarProps> = ({ incidents }) => {
  const total = incidents.length * 18;
  const criticalCount = incidents.filter(i => i.priority === 'critical').length;
  const aiProcessedPercent = incidents.length
    ? Math.round((incidents.filter(i => i.aiProcessed).length / incidents.length) * 100)
    : 0;

  const items = [
    {
      icon: <span style={{ fontSize: 14 }}>📊</span>,
      value: total,
      label: 'Інцидентів за добу',
      color: 'var(--accent)',
      bg: 'rgba(0,242,254,0.10)',
      border: 'rgba(0,242,254,0.2)',
    },
    {
      icon: <IconAI size={14} color="#10B981" />,
      value: `${aiProcessedPercent}%`,
      label: 'Оброблено ШІ',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.10)',
      border: 'rgba(16,185,129,0.2)',
    },
    {
      icon: <IconWarning size={14} color="#EF4444" />,
      value: criticalCount,
      label: 'Критичних',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.2)',
      pulse: true,
    },
  ];

  return (
    <div className="cs-metrics-strip">
      {items.map((m, i) => (
        <div key={i} className="cs-metric-item">
          <div
            className="cs-metric-icon"
            style={{ background: m.bg, border: `1px solid ${m.border}` }}
          >
            {m.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="cs-metric-value" style={{ color: m.color }}>
              {m.value}
              {m.pulse && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: 7,
                    marginLeft: 5,
                    marginBottom: 2,
                    borderRadius: '50%',
                    background: m.color,
                    boxShadow: `0 0 6px ${m.color}`,
                    animation: 'live-ping 1.5s ease infinite',
                  }}
                />
              )}
            </div>
            <div className="cs-metric-label">{m.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsBar;
