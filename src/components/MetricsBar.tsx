import React from 'react';
import { IconAI, IconWarning } from './Icons';
import type { Incident } from '../data/incidents';

interface MetricsBarProps {
  incidents: Incident[];
  /** compact: stacks vertically inside the feed panel */
  compact?: boolean;
}

const MetricsBar: React.FC<MetricsBarProps> = ({ incidents, compact = false }) => {
  const total = incidents.length * 18;
  const criticalCount = incidents.filter(i => i.priority === 'critical').length;

  const items = [
    { icon: '📊', value: total, label: 'Інцидентів за добу', color: 'var(--accent)', bg: 'rgba(0,242,254,0.10)', border: 'rgba(0,242,254,0.2)' },
    { icon: <IconAI size={15} color="#10B981" />, value: '100%', label: 'Оброблено ШІ', color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.2)' },
    { icon: <IconWarning size={15} color="#EF4444" />, value: criticalCount, label: 'Критичних', color: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.2)', pulse: true },
  ];

  if (compact) {
    return (
      <div className="flex flex-col gap-2 pb-1">
        {items.map((m, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: m.bg, border: `1px solid ${m.border}` }}
            >
              {m.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold leading-none flex items-center gap-1.5" style={{ color: m.color }}>
                {m.value}
                {m.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}`, animation: 'ping 1.5s ease infinite' }} />
                )}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Full horizontal bar (legacy)
  return (
    <div className="flex gap-3 px-4 py-3 flex-shrink-0">
      {items.map((m, i) => (
        <div key={i} className="glass-card metric-card flex-1 px-4 py-3 flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: m.bg, border: `1px solid ${m.border}` }}
          >
            {m.icon}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold leading-none flex items-center gap-2" style={{ color: m.color }}>
              {m.value}
              {m.pulse && (
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}`, animation: 'ping 1.5s ease infinite' }} />
              )}
            </div>
            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsBar;
