import React, { useState } from 'react';
import Sidebar, { type SidebarView } from '../components/Sidebar';
import MetricsBar from '../components/MetricsBar';
import IncidentFeed from '../components/IncidentFeed';
import CityMap from '../components/CityMap';
import CityModal from '../components/CityModal';
import ReportView from './ReportView';
import AnalyticsView from './AnalyticsView';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';
import { type Incident, type City, CITIES, CITY_INCIDENTS } from '../data/incidents';
import { IconGlobe, IconPin, IconSearch } from '../components/Icons';

const Dashboard: React.FC = () => {
  // ─── State ────────────────────────────────────────────────────────────
  const [activeView, setActiveView]   = useState<SidebarView>('map');
  const [isFeedOpen, setIsFeedOpen]   = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCityModalOpen, setIsCityModalOpen]   = useState(false);
  const [currentCity, setCurrentCity] = useState<City>(CITIES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep tracks of all incidents locally in the state to allow adding new ones dynamically
  const [allCityIncidents, setAllCityIncidents] = useState<Record<string, Incident[]>>(CITY_INCIDENTS);

  const rawIncidents = allCityIncidents[currentCity.id] ?? [];

  // Filtered incidents based on search query
  const incidents = rawIncidents.filter(inc =>
    inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // When a user selects a city, switch back to map view and update state
  const handleCitySelect = (city: City) => {
    setCurrentCity(city);
    setSelectedIncident(null);
    setActiveView('map'); // Switch to map automatically
  };

  // Add new incident from the AI report view
  const handleAddIncident = (newInc: Incident) => {
    setAllCityIncidents((prev) => {
      const cityId = currentCity.id;
      const currentList = prev[cityId] ?? [];
      return {
        ...prev,
        [cityId]: [newInc, ...currentList],
      };
    });
  };

  // ─── Feed panel width ─────────────────────────────────────────────────
  const FEED_WIDTH = 320;

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]"
    >
      {/* ═══ Sidebar (narrow icons) ════════════════════════════════════ */}
      <Sidebar
        activeView={activeView}
        onViewChange={(v) => {
          setActiveView(v);
        }}
        isFeedOpen={isFeedOpen}
        onFeedToggle={() => setIsFeedOpen(o => !o)}
      />

      {/* ═══ Incident Feed (slides in/out) ═════════════════════════════ */}
      <div
        className="flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 bg-[var(--bg-secondary)]"
        style={{
          width: isFeedOpen ? FEED_WIDTH : 0,
          opacity: isFeedOpen ? 1 : 0,
          borderRight: isFeedOpen ? '1px solid var(--border-color)' : 'none',
        }}
      >
        {/* Feed header */}
        <div
          className="px-5 pt-6 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                style={{ background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'ping 2s ease infinite' }}
              />
              LIVE
            </span>
          </div>

          {/* City selector */}
          <button
            onClick={() => setIsCityModalOpen(true)}
            className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 hover:opacity-85"
            style={{ background: 'var(--accent-dim)', border: '1px solid rgba(0,242,254,0.3)' }}
          >
            <IconGlobe size={16} color="var(--accent)" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold block" style={{ color: 'var(--accent)' }}>{currentCity.name}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <IconPin size={10} color="var(--text-muted)" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentCity.region}</span>
              </div>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>▼</span>
          </button>

          {/* Search bar inside feed */}
          <div className="relative flex items-center mb-4">
            <div className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
              <IconSearch size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук скарг та адрес..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border bg-[var(--bg-secondary)]"
              style={{ borderColor: 'var(--border-color-strong)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs opacity-50 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>

          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Інтелектуальний фід
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            AI-прооброблений канал пайплайн
          </p>
        </div>

        {/* Metrics inside feed panel */}
        <div className="flex-shrink-0 px-4 pt-4">
          <MetricsBar incidents={incidents} compact />
        </div>

        {/* Incident cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <IncidentFeed
            incidents={incidents}
            selectedId={selectedIncident?.id ?? null}
            onSelect={setSelectedIncident}
          />
        </div>
      </div>

      {/* ═══ Main content area ══════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 relative overflow-hidden">
        {activeView === 'map' && (
          <CityMap
            incidents={incidents}
            city={currentCity}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
          />
        )}

        {activeView === 'report' && (
          <div className="w-full h-full overflow-hidden bg-[var(--bg-primary)]">
            <ReportView
              currentCity={currentCity}
              onAddIncident={handleAddIncident}
              onNavigateToMap={() => setActiveView('map')}
            />
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="w-full h-full overflow-hidden bg-[var(--bg-primary)]">
            <AnalyticsView incidents={incidents} />
          </div>
        )}

        {activeView === 'profile' && (
          <div className="w-full h-full overflow-hidden bg-[var(--bg-primary)]">
            <ProfileView />
          </div>
        )}

        {activeView === 'settings' && (
          <div className="w-full h-full overflow-hidden bg-[var(--bg-primary)]">
            <SettingsView />
          </div>
        )}
      </div>

      {/* ═══ City Modal ════════════════════════════════════════════════ */}
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
