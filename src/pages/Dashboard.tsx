import React, { useState, useEffect, useMemo } from 'react';
import Sidebar, { type SidebarView } from '../components/Sidebar';
import MetricsBar from '../components/MetricsBar';
import IncidentFeed from '../components/IncidentFeed';
import CityMap from '../components/CityMap';
import CityModal from '../components/CityModal';
import ReportView from './ReportView';
import AnalyticsView from './AnalyticsView';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';
import CSLogo from '../components/CSLogo';
import { type Incident, type City, CITIES, CITY_INCIDENTS } from '../data/incidents';
import { IconGlobe, IconPin, IconSearch, IconMap, IconAnalytics, IconUser, IconDashboard, IconSettings } from '../components/Icons';
import { fetchCityIncidents, submitIncident, joinIncidentVote } from '../lib/incidents';
import { getSmartCityData } from '../data/smartCityData';

type MobileActiveView = SidebarView | 'feed';

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<SidebarView>('map');
  const [isFeedOpen, setIsFeedOpen] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState<City>(CITIES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Incidents a user submitted through the report form, persisted in MongoDB
  // (via /api/incidents) so they survive a page refresh and are shared across
  // devices/sessions.
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  // Extra "join this incident" votes, keyed by incident id, also persisted.
  const [votes, setVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    fetchCityIncidents(currentCity.id)
      .then(data => {
        if (cancelled) return;
        setUserIncidents(data.incidents);
        setVotes(data.votes);
      })
      .catch(err => console.error('Failed to load incidents from MongoDB:', err));
    return () => { cancelled = true; };
  }, [currentCity.id]);

  const rawIncidents: Incident[] = useMemo(() => {
    const seedWithVotes = (CITY_INCIDENTS[currentCity.id] ?? []).map(inc =>
      votes[inc.id] ? { ...inc, complaintsCount: inc.complaintsCount + votes[inc.id] } : inc
    );
    return [...userIncidents, ...seedWithVotes];
  }, [userIncidents, votes, currentCity.id]);

  const [isSmartPanelOpen, setIsSmartPanelOpen] = useState(true);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { weather, aiRisks, stats } = useMemo(() => {
    return getSmartCityData(currentCity.id, currentCity, rawIncidents, tick);
  }, [currentCity, rawIncidents, tick]);

  // Mobile specific view switcher state
  const [mobileView, setMobileView] = useState<MobileActiveView>('map');
  // Memoized so CityMap's marker-drawing effect (keyed on this array's
  // identity) doesn't re-run and redraw every marker on every unrelated
  // re-render — e.g. right after a marker click sets selectedIncident.
  const incidents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return rawIncidents.filter(inc =>
      inc.title.toLowerCase().includes(q) ||
      inc.location.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q)
    );
  }, [rawIncidents, searchQuery]);

  const handleCitySelect = (city: City) => {
    setCurrentCity(city);
    setSelectedIncident(null);
    setActiveView('map');
    setMobileView('map');
  };

  const handleAddIncident = (cityId: string, newInc: Incident) => {
    if (cityId === currentCity.id) {
      setUserIncidents(prev => [newInc, ...prev]);
      setSelectedIncident(newInc);
    }
    submitIncident(cityId, newInc).catch(err => console.error('Failed to save incident to MongoDB:', err));
  };

  const handleJoinIncident = (incidentId: string) => {
    setVotes(prev => ({ ...prev, [incidentId]: (prev[incidentId] ?? 0) + 1 }));
    joinIncidentVote(incidentId).catch(err => console.error('Failed to save vote to MongoDB:', err));
  };

  const handleMobileNavClick = (view: MobileActiveView) => {
    setMobileView(view);
    if (view !== 'feed' && view !== 'map') {
      setActiveView(view as SidebarView);
    } else if (view === 'map') {
      setActiveView('map');
    }
  };

  const FEED_WIDTH = 308;
  const criticalCount = incidents.filter(i => i.priority === 'critical').length;

  return (
    <div className="cs-app">
      {/* ═══ Desktop Sidebar ═══════════════════════════════════════════ */}
      <Sidebar
        activeView={activeView}
        onViewChange={(v) => { setActiveView(v); setMobileView(v); }}
        isFeedOpen={isFeedOpen}
        onFeedToggle={() => setIsFeedOpen(o => !o)}
      />

      {/* ═══ Mobile Top Header (from design reference) ═════════════════ */}
      <header className="cs-m-header cs-mobile-only">
        <CSLogo size={30} />
        <div className="cs-m-header__logo" onClick={() => setIsCityModalOpen(true)} style={{ cursor: 'pointer' }}>
          <div
              style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-dim)', border: '1px solid rgba(0,242,254,0.3)',
              }}
            >
              <IconGlobe size={18} color="var(--accent)" />
            </div>
          <span className="cs-m-header__title">{currentCity.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
          
        </div>
        <div style={{display: 'flex'}}>
          
          <div className="cs-m-header__profile" onClick={() => handleMobileNavClick('profile')} style={{ cursor: 'pointer' }}>
          {CITIES[0].name.slice(0,2).toUpperCase()}
        </div>
        </div>
        
      </header>

      {/* ═══ Desktop Feed panel ════════════════════════════════════════ */}
      <div
        className="cs-feed cs-desktop-only"
        style={{
          width: isFeedOpen ? FEED_WIDTH : 0,
          opacity: isFeedOpen ? 1 : 0,
        }}
      >
        <div className="cs-feed__header">
          <div style={{ marginBottom: 16 }}>
            <span className="cs-feed__live">
              <span className="cs-feed__live-dot" />
              LIVE
            </span>
          </div>

          <button className="cs-feed__city-btn" onClick={() => setIsCityModalOpen(true)}>
            <IconGlobe size={16} color="var(--accent)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="cs-feed__city-name">{currentCity.name}</span>
              <div className="cs-feed__city-region">
                <IconPin size={10} color="var(--text-muted)" />
                <span>{currentCity.region}</span>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>▼</span>
          </button>

          <div className="cs-feed__search">
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

          <p className="cs-feed__title">Інтелектуальний фід</p>
          <p className="cs-feed__subtitle">AI-прооброблений канал пайплайн</p>
        </div>

        <div className="cs-feed__metrics">
          <MetricsBar incidents={incidents} />
        </div>

        <div className="cs-feed__list">
          <IncidentFeed
            incidents={incidents}
            selectedId={selectedIncident?.id ?? null}
            onSelect={setSelectedIncident}
          />
        </div>
      </div>

      {/* ═══ Main content ══════════════════════════════════════════════ */}
      <div className="cs-main">
        {/* ─── MAP VIEW ─── */}
        {((!window.matchMedia('(max-width: 768px)').matches && activeView === 'map') || 
          (window.matchMedia('(max-width: 768px)').matches && mobileView === 'map')) && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Mobile-only metrics on map (right phone on reference) */}
            <div
              className="cs-mobile-only"
              style={{
                position: 'absolute', zIndex: 990, paddingTop:' 10px',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',alignItems: 'center', gap: 8,
                pointerEvents: 'none', width: '100%', justifyContent: 'center'
              }}
            >
              {[
                { label: 'Усього інцидентів', value: incidents.length * 18, color: 'var(--accent)', icon: '📋' },
                {
                  label: 'Оброблено ШІ',
                  value: `${incidents.length ? Math.round((incidents.filter(i => i.aiProcessed).length / incidents.length) * 100) : 0}%`,
                  color: '#10B981', icon: '🤖',
                },
                { label: 'Критичні кризи', value: criticalCount, color: '#EF4444', icon: '⚠️' }
              ].map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                    padding: '8px 10px', textAlign: 'center', pointerEvents: 'auto',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {m.icon} {m.label}
                  </span>
                  <strong style={{ fontSize: 13, color: m.color, marginTop: 4, display: 'block' }}>{m.value}</strong>
                </div>
              ))}
            </div>

            {/* Desktop General State Panel */}
            <div
              className="cs-glass-card cs-desktop-only"
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 1000,
                padding: '12px 16px',
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Стан Міста</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>{currentCity.name}</div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { label: 'Датчики 📡', value: stats.activeSensors, color: 'var(--text-primary)' },
                  { label: 'Зони ризику ⚠️', value: stats.dangerZonesCount, color: stats.dangerZonesCount > 0 ? '#F97316' : '#10B981' },
                  { label: 'Нові скарги 📋', value: stats.newIncidentsCount, color: 'var(--text-primary)' },
                  { label: 'Якість повітря 🍃', value: stats.avgAirQuality, color: stats.avgAirQuality.includes('155') ? '#EF4444' : '#10B981' },
                  { label: 'Проблеми з водою 💧', value: stats.waterIssuesCount, color: stats.waterIssuesCount > 0 ? '#EF4444' : '#10B981' },
                  { label: 'Найвищий ризик 🛑', value: stats.highestRiskDistricts, color: 'var(--text-secondary)', maxWidth: 120 },
                ].map((stat, idx) => (
                  <div key={idx} style={{ minWidth: 60 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{stat.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: stat.color, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: stat.maxWidth || 'none' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collapsible Smart City Panel (Weather + AI Analysis) */}
            <div
              className="cs-glass-card cs-desktop-only"
              style={{
                position: 'absolute',
                top: 80,
                left: isSmartPanelOpen ? 16 : -310,
                bottom: 20,
                width: 320,
                zIndex: 1000,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
              }}
            >
              {/* Toggle button */}
              <button
                onClick={() => setIsSmartPanelOpen(!isSmartPanelOpen)}
                style={{
                  position: 'absolute',
                  right: -32,
                  top: 16,
                  width: 32,
                  height: 48,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeft: 'none',
                  borderRadius: '0 10px 10px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  boxShadow: '4px 4px 12px rgba(0,0,0,0.15)',
                }}
                title={isSmartPanelOpen ? "Сховати панель" : "Показати панель"}
              >
                {isSmartPanelOpen ? '◀' : '▶'}
              </button>

              {/* Panel content */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 16, gap: 16 }}>
                
                {/* Section 1: Weather */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: 6, marginBottom: 10 }}>
                    🌤️ Погода та Прогноз
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{weather.icon}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{weather.temp}°C</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{weather.condition}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '12px 0 8px', background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Опади</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>{weather.precipitation}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Вітер</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>{weather.windSpeed} км/г</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Вологість</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>{weather.humidity}%</div>
                    </div>
                  </div>

                  {/* 3-hour forecast */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginTop: 8 }}>
                    {weather.forecast.slice(1, 5).map((f, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 4, background: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{f.time}</span>
                        <span style={{ fontSize: 14, margin: '2px 0' }}>{f.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{f.temp}°</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: AI Risk Analysis */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite' }}>🤖</span> ШІ-Аналіз Ризиків
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                    {aiRisks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>🟢</div>
                        <div style={{ fontSize: 11 }}>Всі показники в межах норми. Ризиків не виявлено.</div>
                      </div>
                    ) : (
                      aiRisks.map((risk) => {
                        const riskColor = risk.level === 'danger' ? '#EF4444' : risk.level === 'high' ? '#F97316' : '#F59E0B';
                        const riskBg = risk.level === 'danger' ? 'rgba(239, 68, 68, 0.05)' : risk.level === 'high' ? 'rgba(249, 115, 22, 0.05)' : 'rgba(245, 158, 11, 0.05)';
                        return (
                          <div
                            key={risk.id}
                            style={{
                              background: riskBg,
                              borderLeft: `3px solid ${riskColor}`,
                              borderTop: '1px solid var(--border-color)',
                              borderRight: '1px solid var(--border-color)',
                              borderBottom: '1px solid var(--border-color)',
                              borderRadius: '4px 8px 8px 4px',
                              padding: 10,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {risk.title}
                              </span>
                              <span
                                style={{
                                  fontSize: 8,
                                  fontWeight: 800,
                                  padding: '1px 4px',
                                  borderRadius: 4,
                                  background: `${riskColor}22`,
                                  color: riskColor,
                                  border: `1px solid ${riskColor}44`,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {risk.level === 'danger' ? 'Критично' : risk.level === 'high' ? 'Високий' : 'Увага'}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              <strong>Причина:</strong> {risk.reasons}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              <strong>Наслідки:</strong> {risk.consequences}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: 'var(--accent)',
                                background: 'var(--accent-dim)',
                                border: '1px solid rgba(0,242,254,0.15)',
                                borderRadius: 6,
                                padding: '6px 8px',
                                marginTop: 2,
                                lineHeight: 1.4,
                              }}
                            >
                              <strong>Рекомендація:</strong> {risk.recommendation}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>

            <CityMap
              incidents={incidents}
              city={currentCity}
              selectedIncident={selectedIncident}
              onSelectIncident={setSelectedIncident}
            />
          </div>
        )}

        {/* ─── MOBILE FEED VIEW (left phone on reference) ─── */}
        {window.matchMedia('(max-width: 768px)').matches && mobileView === 'feed' && (
          <div className="cs-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header / Search strip */}
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
                  placeholder="Пошук скарг..."
                />
                {searchQuery && (
                  <button className="cs-feed__search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            </div>
            {/* Incidents feed container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 80px' }}>
              <MetricsBar incidents={incidents} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                <IncidentFeed
                  incidents={incidents}
                  selectedId={selectedIncident?.id ?? null}
                  onSelect={setSelectedIncident}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── REPORT VIEW (New complaint form) ─── */}
        {((!window.matchMedia('(max-width: 768px)').matches && activeView === 'report') || 
          (window.matchMedia('(max-width: 768px)').matches && mobileView === 'report')) && (
          <div className="cs-page">
            <ReportView
              currentCity={currentCity}
              cityIncidents={rawIncidents}
              onAddIncident={handleAddIncident}
              onJoinIncident={handleJoinIncident}
              onNavigateToMap={() => {
                setActiveView('map');
                setMobileView('map');
              }}
            />
          </div>
        )}

        {/* ─── ANALYTICS ─── */}
        {((!window.matchMedia('(max-width: 768px)').matches && activeView === 'analytics') || 
          (window.matchMedia('(max-width: 768px)').matches && mobileView === 'analytics')) && (
          <div className="cs-page">
            <AnalyticsView incidents={incidents} />
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {((!window.matchMedia('(max-width: 768px)').matches && activeView === 'profile') || 
          (window.matchMedia('(max-width: 768px)').matches && mobileView === 'profile')) && (
          <div className="cs-page">
            <ProfileView />
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {((!window.matchMedia('(max-width: 768px)').matches && activeView === 'settings') || 
          (window.matchMedia('(max-width: 768px)').matches && mobileView === 'settings')) && (
          <div className="cs-page">
            <SettingsView />
          </div>
        )}

        {/* ─── Mobile FAB "Новий Звіт" (plugs directly into map/feed, bottom right) ─── */}
        {(mobileView === 'map' || mobileView === 'feed') && (
          <button
            className="cs-btn-neon cs-m-fab cs-mobile-only"
            onClick={() => handleMobileNavClick('report')}
          >
            Новий Звіт
          </button>
        )}
      </div>

      {/* ═══ Mobile Bottom Nav Bar (From design reference) ══════════════ */}
      <nav className="cs-m-nav cs-mobile-only">
        <button
          className={`cs-m-nav__item${mobileView === 'map' ? ' cs-m-nav__item--active' : ''}`}
          onClick={() => handleMobileNavClick('map')}
        >
          <IconMap size={20} color={mobileView === 'map' ? 'var(--accent)' : 'var(--text-muted)'} />
          <span>Карта</span>
        </button>
        <button
          className={`cs-m-nav__item${mobileView === 'feed' ? ' cs-m-nav__item--active' : ''}`}
          onClick={() => handleMobileNavClick('feed')}
        >
          <IconDashboard size={20} color={mobileView === 'feed' ? 'var(--accent)' : 'var(--text-muted)'} />
          <span>Звіти</span>
        </button>
        <button
          className={`cs-m-nav__item${mobileView === 'analytics' ? ' cs-m-nav__item--active' : ''}`}
          onClick={() => handleMobileNavClick('analytics')}
        >
          <IconAnalytics size={20} color={mobileView === 'analytics' ? 'var(--accent)' : 'var(--text-muted)'} />
          <span>Аналітика</span>
        </button>
        <button
          className={`cs-m-nav__item${mobileView === 'profile' ? ' cs-m-nav__item--active' : ''}`}
          onClick={() => handleMobileNavClick('profile')}
        >
          <IconUser size={20} color={mobileView === 'profile' ? 'var(--accent)' : 'var(--text-muted)'} />
          <span>Профіль</span>
        </button>
        <button
          className={`cs-m-nav__item${mobileView === 'settings' ? ' cs-m-nav__item--active' : ''}`}
          onClick={() => handleMobileNavClick('settings')}
        >
          <IconSettings size={20} color={mobileView === 'settings' ? 'var(--accent)' : 'var(--text-muted)'} />
          <span>Налаштування</span>
        </button>
      </nav>

      {/* ═══ City Modal ═══════════════════════════════════════════════ */}
      <CityModal
        isOpen={isCityModalOpen}
        currentCityId={currentCity.id}
        onSelect={handleCitySelect}
        onClose={() => setIsCityModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
