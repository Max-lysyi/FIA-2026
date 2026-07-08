import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';

interface SettingRow {
  id: string;
  icon: string;
  label: string;
  description: string;
  type: 'toggle' | 'info';
  value?: string;
  defaultOn?: boolean;
}

const SETTINGS: SettingRow[] = [
  { id: 'ai', icon: '🤖', label: 'ШІ-класифікація скарг', description: 'Автоматичний розбір звернень у реальному часі', type: 'toggle', defaultOn: true },
  { id: 'notif', icon: '🔔', label: 'Push-сповіщення про дублікати', description: 'Надсилати сповіщення при знаходженні подібних заяв поруч', type: 'toggle', defaultOn: true },
  { id: 'cluster', icon: '🗺️', label: 'Кластеризація на карті', description: 'Групувати маркери при зменшенні масштабу', type: 'toggle', defaultOn: true },
  { id: 'lang', icon: '🌍', label: 'Мова інтерфейсу', description: 'Обрати основну локаль сайту', type: 'info', value: 'Українська' },
];

const SettingsView: React.FC = () => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    ai: true, notif: true, cluster: true,
  });

  return (
    <div className="cs-scroll-page">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 className="cs-page-title">Налаштування</h1>
        <p className="cs-page-subtitle">Налаштуйте систему інтелектуального моніторингу під власні потреби</p>

        {/* Theme */}
        <div className="cs-settings-card" style={{ marginBottom: 20 }}>
          <div className="cs-settings-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>🎨 Тема інтерфейсу</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Перемикайте між темною та світлою темою</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Main settings */}
        <div className="cs-settings-card">
          {SETTINGS.map(row => (
            <div key={row.id} className="cs-settings-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{row.icon} {row.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.description}</span>
              </div>

              {row.type === 'toggle' ? (
                <label className="cs-toggle">
                  <input
                    type="checkbox"
                    checked={toggles[row.id] ?? false}
                    onChange={() => setToggles(p => ({ ...p, [row.id]: !p[row.id] }))}
                  />
                  <span className="cs-toggle__track" />
                </label>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{row.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* About block */}
        <div className="cs-settings-card" style={{ marginTop: 20 }}>
          <div className="cs-settings-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>🚀 CitySense v1.0</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Семантична карта міських інцидентів. FIA Hackathon 2026</span>
            </div>
            <span
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: 'rgba(0,242,254,0.12)', color: 'var(--accent)',
                border: '1px solid rgba(0,242,254,0.25)',
              }}
            >
              BETA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
