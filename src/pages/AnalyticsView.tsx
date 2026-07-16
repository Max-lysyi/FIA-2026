import React, { useState, useEffect } from 'react';
import { CATEGORY_CONFIG, type Incident } from '../data/incidents';
import { IconAI, IconWarning, IconPin } from '../components/Icons';
import { generateInsight } from '../lib/insights';
import Leaderboard from '../components/Leaderboard';

interface AnalyticsViewProps {
  incidents: Incident[];
}

// Donut chart using SVG
const PieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumAngle = -90;
  const cx = 80, cy = 80, r = 60, innerR = 34;

  const slices = data.map(d => {
    const angle = (d.value / total) * 360;
    const startAngle = (cumAngle * Math.PI) / 180;
    cumAngle += angle;
    const endAngle = (cumAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(startAngle);
    const yi1 = cy + innerR * Math.sin(startAngle);
    const xi2 = cx + innerR * Math.cos(endAngle);
    const yi2 = cy + innerR * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    return {
      ...d,
      path: `M${xi1} ${yi1} L${x1} ${y1} A${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L${xi2} ${yi2} A${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1} Z`,
    };
  });

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.9} />
      ))}
      <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--bg-secondary)" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--text-primary)">
        {total}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
        інцидентів
      </text>
    </svg>
  );
};

// Mini bar
const MiniBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: color, boxShadow: `0 0 6px ${color}80` }} />
    <span style={{ fontSize: 12, width: 80, flexShrink: 0, color: 'var(--text-secondary)' }}>{label}</span>
    <div style={{ flex: 1, height: 6, borderRadius: 4, overflow: 'hidden', background: 'var(--border-color)' }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', borderRadius: 4, background: color, boxShadow: `0 0 8px ${color}60` }} />
    </div>
    <span style={{ fontSize: 11, fontWeight: 600, width: 32, textAlign: 'right', color: 'var(--text-primary)' }}>{value}</span>
  </div>
);

// Sparkline
const WeekChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  const w = 280, h = 60;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h * 0.85}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ incidents }) => {
  const total = incidents.length * 18;
  const critical = incidents.filter(i => i.priority === 'critical').length;

  const [insight, setInsight] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const incidentsKey = incidents.map(i => i.id).join(',');

  const loadInsight = React.useCallback(() => {
    setIsInsightLoading(true);
    setInsightError(null);
    generateInsight(incidents)
      .then(setInsight)
      .catch(e => setInsightError(e instanceof Error ? e.message : 'Не вдалося отримати аналіз ШІ'))
      .finally(() => setIsInsightLoading(false));
  }, [incidents]);

  useEffect(() => {
    loadInsight();
  }, [incidentsKey]);

  const catCounts = Object.keys(CATEGORY_CONFIG).map(key => {
    const cfg = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];
    const count = incidents.filter(i => i.category === key).length;
    return { label: cfg.label, value: count || 1, color: cfg.markerColor };
  });

  // Real breakdown of incidents that were actually classified by a live
  // Aethercode call (submitted through the report form), by category.
  const aiProcessedByCategory = Object.keys(CATEGORY_CONFIG).map(key => {
    const cfg = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];
    const count = incidents.filter(i => i.aiProcessed && i.category === key).length;
    return { label: cfg.label, value: count, color: cfg.markerColor };
  });
  const maxAiProcessed = Math.max(1, ...aiProcessedByCategory.map(c => c.value));

  const resolutionTimes = [
    { label: 'ЖКГ', value: 375, color: '#3B82F6' },
    { label: 'Екологія', value: 198, color: '#10B981' },
    { label: 'Транспорт', value: 270, color: '#F59E0B' },
    { label: 'Благоустрій', value: 155, color: '#A855F7' },
    { label: 'Критичні', value: 125, color: '#EF4444' },
  ];
  const maxTime = Math.max(...resolutionTimes.map(r => r.value));

  const topLocations = incidents
    .sort((a, b) => b.complaintsCount - a.complaintsCount)
    .slice(0, 4)
    .map(i => ({ label: i.location, value: i.complaintsCount }));

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  const trendData = [45, 78, 62, 95, 80, 55, 70];

  const aiProcessedCount = incidents.filter(i => i.aiProcessed).length;
  const aiProcessedPercent = incidents.length ? Math.round((aiProcessedCount / incidents.length) * 100) : 0;

  const topMetrics = [
    { icon: '📊', value: total, label: 'Усього інцидентів за добу', color: 'var(--accent)' },
    { icon: <IconAI size={18} color="#10B981" />, value: `${aiProcessedPercent}%`, label: `Оброблено ШІ автоматично (${aiProcessedCount} з ${incidents.length})`, color: '#10B981' },
    { icon: <IconWarning size={18} color="#EF4444" />, value: critical, label: 'Критичні кризи (Потребують уваги)', color: '#EF4444', pulse: true },
  ];

  return (
    <div className="cs-scroll-page">
      <div style={{  margin: '0 auto' }}>
        <h1 className="cs-page-title">Аналітика</h1>
        <p className="cs-page-subtitle">AI-прооброблений канал пайплайн</p>

        {/* AI-generated insight, based on the live incidents list */}
        <div className="cs-glass-card" style={{ padding: 18, marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <IconAI size={18} color="#10B981" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>ШІ-висновок по поточних інцидентах</span>
              <button
                onClick={loadInsight}
                disabled={isInsightLoading}
                style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'transparent',
                  border: 'none', cursor: isInsightLoading ? 'default' : 'pointer', opacity: isInsightLoading ? 0.5 : 1,
                }}
              >
                {isInsightLoading ? 'Аналізую…' : '🔄 Оновити'}
              </button>
            </div>
            {insightError ? (
              <p style={{ fontSize: 12, color: '#EF4444' }}>⚠️ {insightError}</p>
            ) : (
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {isInsightLoading ? 'ШІ аналізує поточну ситуацію по місту…' : insight}
              </p>
            )}
          </div>
        </div>

        {/* Top metrics */}
        <div className="cs-an-top" style={{ marginBottom: 24 }}>
          {topMetrics.map((m, i) => (
            <div
              key={i}
              className="cs-glass-card"
              style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 18,
                  background: `${m.color}18`,
                  border: `1px solid ${m.color}30`,
                }}
              >
                {m.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.value}
                  {m.pulse && (
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}`, animation: 'live-ping 1.5s ease infinite' }} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="cs-an-main" style={{ marginBottom: 16}}>
          {/* Pie */}
          <div className="cs-glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Розподіл за категоріями</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <PieChart data={catCounts} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catCounts.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: c.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top locations */}
          <div className="cs-glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>ТОП-локації за критичними інцидентами</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topLocations.map((loc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, flexShrink: 0,
                      background: i === 0 ? 'rgba(239,68,68,0.15)' : 'var(--bg-glass)',
                      color: i === 0 ? '#EF4444' : 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <IconPin size={14} color="var(--accent)" />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.label}</span>
                  <div style={{ width: 100, height: 6, borderRadius: 4, overflow: 'hidden', background: 'var(--border-color)' }}>
                    <div
                      style={{
                        width: `${(loc.value / topLocations[0].value) * 100}%`,
                        height: '100%', borderRadius: 4,
                        background: 'linear-gradient(90deg, #EF4444, #F97316)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#EF4444', flexShrink: 0 }}>
                    ({loc.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom grid */}
        <div className="cs-an-bottom">
          {/* Resolution times */}
          <div className="cs-glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Середній час вирішення (хв)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resolutionTimes.map((rt, i) => (
                <MiniBar key={i} label={rt.label} value={rt.value} max={maxTime} color={rt.color} />
              ))}
            </div>
          </div>

          {/* Weekly trend */}
          <div className="cs-glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Тенденції за тиждень</h3>
            <div style={{ overflow: 'hidden' }}>
              <WeekChart data={trendData} color="var(--accent)" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {weekDays.map(d => (
                  <span key={d} style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
              {[{ label: 'ЖКГ', color: '#3B82F6' }, { label: 'Екологія', color: '#10B981' }, { label: 'Транспорт', color: '#F59E0B' }].map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI processed breakdown — real counts, not decorative percentages */}
          <div className="cs-glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Реально оброблено ШІ ({aiProcessedCount})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {aiProcessedByCategory.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconAI size={14} color={item.color} />
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <div style={{ width: 80, height: 6, borderRadius: 4, overflow: 'hidden', background: 'var(--border-color)' }}>
                    <div style={{ width: `${(item.value / maxAiProcessed) * 100}%`, height: '100%', borderRadius: 4, background: item.color }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, width: 36, textAlign: 'right', color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <Leaderboard />
      </div>
    </div>
  );
};

export default AnalyticsView;
