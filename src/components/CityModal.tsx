import React from 'react';
import { CITIES, type City } from '../data/incidents';
import { IconGlobe, IconChevronRight, IconPin } from './Icons';

interface CityModalProps {
  isOpen: boolean;
  currentCityId: string;
  onSelect: (city: City) => void;
  onClose: () => void;
}

const CITY_STATS: Record<string, { incidents: number; critical: number }> = {
  vinnytsia: { incidents: 142, critical: 3 },
  zhytomyr: { incidents: 87, critical: 2 },
  khmelnytskyi: { incidents: 115, critical: 4 },
  kyiv: { incidents: 489, critical: 12 },
};

const CityModal: React.FC<CityModalProps> = ({ isOpen, currentCityId, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md fade-in"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color-strong)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,242,254,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)40' }}
            >
              <IconGlobe size={18} color="var(--accent)" />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                Оберіть місто
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Завантажує інциденти обраного міста
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-200 hover:opacity-70"
            style={{
              background: 'var(--bg-glass)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Cities list */}
        <div className="p-4 flex flex-col gap-2">
          {CITIES.map((city) => {
            const stats = CITY_STATS[city.id];
            const isActive = city.id === currentCityId;

            return (
              <button
                key={city.id}
                onClick={() => { onSelect(city); onClose(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: isActive ? 'var(--accent-dim)' : 'var(--bg-glass)',
                  border: isActive
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border-color)',
                  boxShadow: isActive ? '0 0 20px var(--accent)15' : 'none',
                }}
              >
                {/* City icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #00F2FE, #3B82F6)'
                      : 'var(--bg-card)',
                    border: isActive ? 'none' : '1px solid var(--border-color)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 0 16px rgba(0,242,254,0.3)' : 'none',
                  }}
                >
                  {city.name.slice(0, 2)}
                </div>

                {/* City info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {city.name}
                    </span>
                    {isActive && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--accent)20', color: 'var(--accent)' }}
                      >
                        активне
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <IconPin size={11} color="var(--text-muted)" />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{city.region}</span>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold" style={{ color: 'var(--accent)' }}>{stats.incidents}</span> інцидентів
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: '#EF4444' }}
                    >
                      <span className="font-semibold">{stats.critical}</span> критичних
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <IconChevronRight size={16} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div
          className="px-6 py-3 text-xs text-center rounded-b-[20px]"
          style={{
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            background: 'var(--bg-glass)',
          }}
        >
          🤖 ШІ аналізує інциденти кожного міста окремо
        </div>
      </div>
    </>
  );
};

export default CityModal;
