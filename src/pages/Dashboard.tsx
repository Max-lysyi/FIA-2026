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

  // Mobile specific view switcher state
  const [mobileView, setMobileView] = useState<MobileActiveView>('map');
  const incidents = rawIncidents.filter(inc =>
    inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCitySelect = (city: City) => {
    setCurrentCity(city);
    setSelectedIncident(null);
    setActiveView('map');
    setMobileView('map');
  };

  const handleAddIncident = (newInc: Incident) => {
    setUserIncidents(prev => [newInc, ...prev]);
    submitIncident(currentCity.id, newInc).catch(err => console.error('Failed to save incident to MongoDB:', err));
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
        <div className="cs-m-header__logo" onClick={() => setIsCityModalOpen(true)} style={{ cursor: 'pointer' }}>
          <CSLogo size={30} />
          <span className="cs-m-header__title">{currentCity.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
        </div>
        <div className="cs-m-header__profile" onClick={() => handleMobileNavClick('profile')} style={{ cursor: 'pointer' }}>
          {CITIES[0].name.slice(0,2).toUpperCase()}
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
                position: 'absolute', top: 12, left: 12, right: 12, zIndex: 90,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                pointerEvents: 'none',
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
