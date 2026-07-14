import React, { useState, useEffect, useMemo } from 'react';
import CityMap from '../components/CityMap';
import ReportSheet, { type ReportData } from '../components/ReportSheet';
import ThemeToggle from '../components/ThemeToggle';
import { CITY_INCIDENTS, CITIES, type Incident } from '../data/incidents';
import { fetchCityIncidents, submitIncident } from '../lib/incidents';

const defaultCity = CITIES[0];

const MobileView: React.FC = () => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});

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

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Full-screen Map */}
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
        <div
          className="glass-card px-4 py-3 flex items-center justify-between"
        >
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
              className="glass-card px-3 py-2 flex items-center gap-2 fade-in"
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
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe-bottom pb-8 flex flex-col items-center gap-4 px-4">

        {/* Stats mini-strip */}
        <div
          className="glass-card px-4 py-2 flex items-center gap-4 text-xs"
          style={{ borderRadius: 50 }}
        >
          <div className="flex items-center gap-1">
            <span style={{ color: '#EF4444' }}>●</span>
            <span style={{ color: 'var(--text-secondary)' }}>{criticalCount} критичних</span>
          </div>
          <div className="w-px h-3" style={{ background: 'var(--border-color)' }} />
          <div className="flex items-center gap-1">
            <span style={{ color: '#10B981' }}>●</span>
            <span style={{ color: 'var(--text-secondary)' }}>{incidents.length} за добу</span>
          </div>
          <div className="w-px h-3" style={{ background: 'var(--border-color)' }} />
          <div className="flex items-center gap-1">
            <span style={{ color: 'var(--accent)' }}>AI</span>
            <span style={{ color: 'var(--text-secondary)' }}>{aiProcessedPercent}%</span>
          </div>
        </div>

        {/* FAB */}
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

      {/* Report Sheet */}
      <ReportSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReport}
        cityCenter={{ lat: defaultCity.lat, lng: defaultCity.lng }}
      />
    </div>
  );
};

export default MobileView;
