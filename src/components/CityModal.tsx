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
      {/* Overlay — always on top of Leaflet */}
      <div className="cs-city-modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="cs-city-modal fade-in">
        {/* Header */}
        <div className="cs-city-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-dim)', border: '1px solid rgba(0,242,254,0.3)',
              }}
            >
              <IconGlobe size={18} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Оберіть місто</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Завантажує інциденти обраного міста</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10, border: '1px solid var(--border-color)',
              background: 'var(--bg-glass)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>

        {/* City list */}
        <div className="cs-city-modal__list">
          {CITIES.map((city) => {
            const stats = CITY_STATS[city.id];
            const isActive = city.id === currentCityId;
            return (
              <button
                key={city.id}
                onClick={() => { onSelect(city); onClose(); }}
                className={`cs-city-item${isActive ? ' cs-city-item--active' : ''}`}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800,
                    background: isActive ? 'linear-gradient(135deg, #00F2FE, #3B82F6)' : 'var(--bg-secondary)',
                    border: isActive ? 'none' : '1px solid var(--border-color)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    boxShadow: isActive ? '0 0 16px rgba(0,242,254,0.3)' : 'none',
                  }}
                >
                  {city.name.slice(0, 2)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {city.name}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,242,254,0.12)', color: 'var(--accent)' }}>
                        активне
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <IconPin size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{city.region}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--accent)' }}>{stats.incidents}</strong> інцидентів
                    </span>
                    <span style={{ color: '#EF4444' }}>
                      <strong>{stats.critical}</strong> критичних
                    </span>
                  </div>
                </div>

                <IconChevronRight size={16} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px', borderTop: '1px solid var(--border-color)',
            textAlign: 'center', fontSize: 11, color: 'var(--text-muted)',
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
