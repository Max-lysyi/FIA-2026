import React from 'react';
import { CATEGORY_CONFIG, type Incident } from '../data/incidents';
import { IconAI, IconWarning, IconPin } from '../components/Icons';

interface AnalyticsViewProps {
  incidents: Incident[];
}

// Simple donut/pie chart using SVG
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
      pct: Math.round(d.value / total * 100),
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

// Mini bar chart
const MiniBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
    />
    <span className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${(value / max) * 100}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
    <span className="text-xs font-semibold w-8 text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
  </div>
);

// Sparkline-style week chart
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

  // Category breakdown
  const catCounts = Object.keys(CATEGORY_CONFIG).map(key => {
    const cfg = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];
    const count = incidents.filter(i => i.category === key).length;
    return { label: cfg.label, value: count || 1, color: cfg.markerColor };
  });

  // Resolution times (mock)
  const resolutionTimes = [
    { label: 'ЖКГ', value: 375, color: '#3B82F6' },
    { label: 'Екологія', value: 198, color: '#10B981' },
    { label: 'Транспорт', value: 270, color: '#F59E0B' },
    { label: 'Благоустрій', value: 155, color: '#A855F7' },
    { label: 'Критичні', value: 125, color: '#EF4444' },
  ];
  const maxTime = Math.max(...resolutionTimes.map(r => r.value));

  // Top locations
  const topLocations = incidents
    .sort((a, b) => b.complaintsCount - a.complaintsCount)
    .slice(0, 4)
    .map(i => ({ label: i.location, value: i.complaintsCount }));

  // Weekly trend mock data
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  const trendData = [45, 78, 62, 95, 80, 55, 70];

  return (
    <div className="h-full overflow-y-auto px-6 py-6" style={{ color: 'var(--text-primary)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Аналітика</h1>
          <p style={{ color: 'var(--text-muted)' }}>AI-прооброблений канал пайплайн</p>
        </div>

        {/* ── Top metrics ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: '📊', value: total, label: 'Усього інцидентів за добу', color: 'var(--accent)' },
            { icon: <IconAI size={18} color="#10B981" />, value: '100%', label: 'Оброблено ШІ автоматично', color: '#10B981' },
            { icon: <IconWarning size={18} color="#EF4444" />, value: critical, label: 'Критичні кризи (Потребують уваги)', color: '#EF4444', pulse: true },
          ].map((m, i) => (
            <div key={i} className="glass-card metric-card px-5 py-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}30` }}
              >
                {m.icon}
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: m.color }}>
                  {m.value}
                  {m.pulse && <span className="inline-block w-2 h-2 rounded-full ml-2 align-middle" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}`, animation: 'ping 1.5s ease infinite' }} />}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Pie chart */}
          <div className="glass-card p-5 col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Розподіл за категоріями</h3>
            </div>
            <div className="flex items-center gap-4">
              <PieChart data={catCounts} />
              <div className="flex flex-col gap-2">
                {catCounts.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top locations */}
          <div className="glass-card p-5 col-span-2">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              ТОП-локації за критичними інцидентами
            </h3>
            <div className="flex flex-col gap-3">
              {topLocations.map((loc, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: i === 0 ? 'rgba(239,68,68,0.15)' : 'var(--bg-glass)', color: i === 0 ? '#EF4444' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                  >
                    {i + 1}
                  </div>
                  <IconPin size={14} color="var(--accent)" />
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{loc.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden mx-2" style={{ background: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(loc.value / topLocations[0].value) * 100}%`,
                        background: 'linear-gradient(90deg, #EF4444, #F97316)',
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                  >
                    ({loc.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {/* Resolution times */}
          <div className="glass-card p-5 col-span-1">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Середній час вирішення (хв)
            </h3>
            <div className="flex flex-col gap-3">
              {resolutionTimes.map((rt, i) => (
                <MiniBar key={i} label={rt.label} value={rt.value} max={maxTime} color={rt.color} />
              ))}
            </div>
          </div>

          {/* Weekly trend */}
          <div className="glass-card p-5 col-span-1">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Тенденції за тиждень
            </h3>
            <div className="overflow-hidden">
              <WeekChart data={trendData} color="var(--accent)" />
              <div className="flex justify-between mt-2">
                {weekDays.map(d => (
                  <span key={d} className="text-xs" style={{ color: 'var(--text-muted)' }}>{d}</span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {[{ label: 'ЖКГ', color: '#3B82F6' }, { label: 'Екологія', color: '#10B981' }, { label: 'Транспорт', color: '#F59E0B' }].map(t => (
                <div key={t.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI efficiency */}
          <div className="glass-card p-5 col-span-1">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Ефективність ШІ парсингу
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Класифікація', value: 100, color: '#10B981' },
                { label: 'Пріоритизація', value: 95, color: '#10B981' },
                { label: 'Маршрутизація ЖКГ', value: 95, color: '#10B981' },
                { label: 'Розпізнавання', value: 99, color: '#10B981' },
                { label: 'ШІ парсинг', value: 100, color: '#10B981' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <IconAI size={14} color={item.color} />
                  <span className="flex-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right" style={{ color: item.color }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
