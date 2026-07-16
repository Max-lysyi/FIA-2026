import React, { useState, useEffect, useMemo } from 'react';
import CityMap from '../components/CityMap';
import ReportSheet, { type ReportData } from '../components/ReportSheet';
import ThemeToggle from '../components/ThemeToggle';
import IncidentFeed from '../components/IncidentFeed';
import AnalyticsView from './AnalyticsView';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';
import { CITY_INCIDENTS, CITIES, type Incident } from '../data/incidents';
import { fetchCityIncidents, submitIncident } from '../lib/incidents';
import { IconMap, IconDashboard, IconAnalytics, IconUser, IconSettings, IconSearch } from '../components/Icons';
import { getSmartCityData } from '../data/smartCityData';

const defaultCity = CITIES[0];

type MobileNavView = 'map' | 'feed' | 'analytics' | 'profile' | 'settings';

const MobileView: React.FC = () => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [navView, setNavView] = useState<MobileNavView>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSmartPanelOpen, setIsSmartPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCityIncidents(defaultCity.id)
      .then(data => {
        if (cancelled) return;
        setUserIncidents(data.incidents);
        setVotes(data.votes);
      })
      .catch(err => console.error('Failed to load incidents from MongoDB:', err));
    return () => { cancelled = true; };
  }, []);

  const incidents: Incident[] = useMemo(() => {
    const seedWithVotes = CITY_INCIDENTS[defaultCity.id].map(inc =>
      votes[inc.id] ? { ...inc, complaintsCount: inc.complaintsCount + votes[inc.id] } : inc
    );
    return [...userIncidents, ...seedWithVotes];
  }, [userIncidents, votes]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { weather, aiRisks, stats } = useMemo(() => {
    return getSmartCityData(defaultCity.id, defaultCity, incidents, tick);
  }, [incidents, tick]);

  const filteredIncidents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return incidents.filter(inc =>
      inc.title.toLowerCase().includes(q) ||
      inc.location.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q)
    );
  }, [incidents, searchQuery]);

  const RECENT_RESOLVED = incidents.filter(i => i.status === 'resolved').slice(0, 3);
  const criticalCount = incidents.filter(i => i.priority === 'critical').length;
  const aiProcessedPercent = incidents.length
    ? Math.round((incidents.filter(i => i.aiProcessed).length / incidents.length) * 100)
    : 0;

  const handleReport = (data: ReportData) => {
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      title: data.text.split('.')[0].slice(0, 60) || 'Новий інцидент',
      description: data.text,
      category: data.category,
      status: 'new',
      priority: data.priority,
      location: data.location,
      lat: data.lat,
      lng: data.lng,
      complaintsCount: 1,
      timeAgo: 'Щойно',
      department: data.department,
      aiProcessed: data.aiProcessed,
    };

    setUserIncidents(prev => [newIncident, ...prev]);
    setSelectedIncident(newIncident);
    submitIncident(defaultCity.id, newIncident).catch(err => console.error('Failed to save incident to MongoDB:', err));
  };

  const NAV_ITEMS: { id: MobileNavView; label: string; icon: React.FC<{ size?: number; color?: string }> }[] = [
    { id: 'map', label: 'Карта', icon: IconMap },
    { id: 'feed', label: 'Звіти', icon: IconDashboard },
    { id: 'analytics', label: 'Аналітика', icon: IconAnalytics },
    { id: 'profile', label: 'Профіль', icon: IconUser },
    { id: 'settings', label: 'Налаштування', icon: IconSettings },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col">
      <div className="relative flex-1 min-h-0">
        {/* ─── MAP (default full-screen view) ─── */}
        {navView === 'map' && (
          <>
            <div className="absolute inset-0">
              <CityMap
                incidents={incidents}
                city={defaultCity}
                selectedIncident={selectedIncident}
                onSelectIncident={setSelectedIncident}
              />
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-safe-top pt-4">
              <div className="cs-glass-card px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-lg text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #00F2FE, #3B82F6)' }}
                  >
                    AI
                  </span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    CitySense
                  </span>
                </div>
                <ThemeToggle />
              </div>

              {/* Recent resolved floating cards */}
              <div className="flex flex-col gap-2 mt-3">
                {RECENT_RESOLVED.map((incident, i) => (
                  <div
                    key={incident.id}
                    className="cs-glass-card px-3 py-2 flex items-center gap-2 fade-in"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      borderLeft: '3px solid #10B981',
                      animation: `float ${3 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  >
                    <span className="text-green-400 text-lg">✅</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {incident.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {incident.timeAgo} · {incident.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom FAB */}
            <div className="absolute z-20 flex flex-col items-center gap-4 px-4" style={{ bottom: 74, left: 0, right: 0 }}>
              <button
                onClick={() => setIsSmartPanelOpen(true)}
                className="cs-glass-card px-4 py-2 flex items-center gap-2 text-xs font-semibold cursor-pointer"
                style={{ borderRadius: 50, border: '1px solid var(--accent)', color: 'var(--accent)' }}
              >
                📊 Стан міста & Погода & ШІ
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                className="fab-pulse btn-neon w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: 'linear-gradient(135deg, #00F2FE, #3B82F6)',
                  boxShadow: '0 0 32px rgba(0, 242, 254, 0.4)',
                }}
              >
                📣
              </button>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Сповістити про проблему
              </p>
            </div>
          </>
        )}

        {/* ─── FEED ─── */}
        {navView === 'feed' && (
          <div className="cs-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
              <div className="cs-feed__search" style={{ marginBottom: 0 }}>
                <span className="cs-feed__search-icon">
                  <IconSearch size={14} color="var(--text-muted)" />
                </span>
                <input
                  className="cs-feed__search-input"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Пошук скарг та адрес..."
                />
                {searchQuery && (
                  <button className="cs-feed__search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <IncidentFeed
                  incidents={filteredIncidents}
                  selectedId={selectedIncident?.id ?? null}
                  onSelect={inc => { setSelectedIncident(inc); setNavView('map'); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── ANALYTICS ─── */}
        {navView === 'analytics' && (
          <div className="cs-page" style={{ height: '100%', overflowY: 'auto' }}>
            <AnalyticsView incidents={incidents} />
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {navView === 'profile' && (
          <div className="cs-page" style={{ height: '100%', overflowY: 'auto' }}>
            <ProfileView />
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {navView === 'settings' && (
          <div className="cs-page" style={{ height: '100%', overflowY: 'auto' }}>
            <SettingsView />
          </div>
        )}
      </div>

      {/* ═══ Bottom Nav Bar ═══ */}
      <nav className="cs-m-nav" style={{ display: 'flex' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`cs-m-nav__item${navView === id ? ' cs-m-nav__item--active' : ''}`}
            onClick={() => setNavView(id)}
          >
            <Icon size={20} color={navView === id ? 'var(--accent)' : 'var(--text-muted)'} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Report Sheet */}
      <ReportSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReport}
        cityCenter={{ lat: defaultCity.lat, lng: defaultCity.lng }}
      />

      {/* Mobile Smart Panel Overlay Modal */}
      {isSmartPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md"
          style={{ padding: '24px 16px' }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🤖 Стан міста {defaultCity.name}
            </h2>
            <button
              onClick={() => setIsSmartPanelOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-lg font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">
            {/* Stats section */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Датчики 📡', value: stats.activeSensors, color: 'text-white' },
                { label: 'Зони ризику ⚠️', value: stats.dangerZonesCount, color: stats.dangerZonesCount > 0 ? 'text-orange-400' : 'text-green-400' },
                { label: 'Нові скарги 📋', value: stats.newIncidentsCount, color: 'text-white' },
                { label: 'Якість повітря 🍃', value: stats.avgAirQuality, color: stats.avgAirQuality.includes('155') ? 'text-red-400' : 'text-green-400' },
                { label: 'Проблеми з водою 💧', value: stats.waterIssuesCount, color: stats.waterIssuesCount > 0 ? 'text-red-400' : 'text-green-400' },
                { label: 'Найвищий ризик 🛑', value: stats.highestRiskDistricts, color: 'text-gray-300' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-xs text-gray-400 block uppercase tracking-wider">{stat.label}</span>
                  <strong className={`text-sm ${stat.color} block mt-1`}>{stat.value}</strong>
                </div>
              ))}
            </div>

            {/* Weather section */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🌤️ Погода та Прогноз</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{weather.icon}</span>
                <div>
                  <div className="text-lg font-bold text-white">{weather.temp}°C</div>
                  <div className="text-xs text-gray-400">{weather.condition}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="bg-white/5 rounded-lg p-2">
                  <span className="text-xs text-gray-400 block">Опади</span>
                  <strong className="text-white block mt-0.5">{weather.precipitation}</strong>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <span className="text-xs text-gray-400 block">Вітер</span>
                  <strong className="text-white block mt-0.5">{weather.windSpeed} км/г</strong>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <span className="text-xs text-gray-400 block">Вологість</span>
                  <strong className="text-white block mt-0.5">{weather.humidity}%</strong>
                </div>
              </div>

              {/* 3-hour forecast */}
              <div className="flex justify-between gap-2 mt-4">
                {weather.forecast.slice(1, 5).map((f, i) => (
                  <div key={i} className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-400">{f.time}</div>
                    <div className="text-lg my-1">{f.icon}</div>
                    <div className="text-xs font-bold text-white">{f.temp}°</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Risks section */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🤖 ШІ-Аналіз Ризиків</h3>
              <div className="flex flex-col gap-3">
                {aiRisks.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    🟢 Всі показники в межах норми. Ризиків не виявлено.
                  </div>
                ) : (
                  aiRisks.map((risk) => {
                    const riskColor = risk.level === 'danger' ? 'border-red-500' : risk.level === 'high' ? 'border-orange-500' : 'border-amber-500';
                    const riskBg = risk.level === 'danger' ? 'bg-red-500/5' : risk.level === 'high' ? 'bg-orange-500/5' : 'bg-amber-500/5';
                    return (
                      <div key={risk.id} className={`border-l-2 ${riskColor} ${riskBg} border border-y-white/10 border-r-white/10 rounded-r-lg p-3 text-xs flex flex-col gap-2`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white">{risk.title}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${risk.level === 'danger' ? 'text-red-400 bg-red-400/10 border-red-400/20' : risk.level === 'high' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                            {risk.level === 'danger' ? 'КРИТИЧНО' : risk.level === 'high' ? 'ВИСОКИЙ' : 'УВАГА'}
                          </span>
                        </div>
                        <div>
                          <strong className="text-gray-400">Причина: </strong>
                          <span className="text-gray-300">{risk.reasons}</span>
                        </div>
                        <div>
                          <strong className="text-gray-400">Наслідки: </strong>
                          <span className="text-gray-300">{risk.consequences}</span>
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-md p-2 text-cyan-300 mt-1">
                          <strong>Рекомендація: </strong>
                          {risk.recommendation}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileView;
