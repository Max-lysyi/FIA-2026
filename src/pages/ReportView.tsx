import React, { useState, useEffect, useMemo } from 'react';
import { CATEGORY_CONFIG, type Incident, type City, CITIES } from '../data/incidents';
import { useAuth } from '../context/AuthContext';
import { classifyIncident } from '../lib/ai';

interface ReportViewProps {
  currentCity: City;
  cityIncidents: Incident[];
  onAddIncident: (incident: Incident) => void;
  onJoinIncident: (incidentId: string) => void;
  onNavigateToMap: () => void;
}

const DUPLICATE_RADIUS_METERS = 100;

// Haversine distance in meters between two lat/lng points.
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const IconSparkles = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.3-6.3l-.7.7M6.7 17.3l-.7.7m12.6 0l-.7-.7M6.7 6.7l-.7-.7M10 8.5L12 6l2 2.5L16.5 8l-2.5 2L15 12.5l-3-2-3 2 .5-2.5L7 8l3 .5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconUpload = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const KHMELNYTSKYI_STREETS = [
  'вул. Проскурівська',
  'вул. Кам\'янецька',
  'вул. Подільська',
  'вул. Свободи',
  'вул. Озерна',
  'вул. Зарічанська',
  'вул. Соборна',
  'вул. Грушевського',
  'вул. Шевченка',
  'вул. Незалежності',
];

function normalizeAddress(value: string): string {
  return value
    .toLowerCase()
    .replace(/вул\.?|просп\.?|пров\.?|бульв\.?/g, '')
    .replace(/['’ʼ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ReportView: React.FC<ReportViewProps> = ({ currentCity, cityIncidents, onAddIncident, onJoinIncident, onNavigateToMap }) => {
  const { user, addPoints } = useAuth();

  const [address, setAddress] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStreets, setFilteredStreets] = useState<string[]>([]);
  const [cityId, setCityId] = useState(CITIES.find(c => c.id === 'khmelnytskyi')?.id ?? currentCity.id);
  const [timeFound, setTimeFound] = useState('');
  const [description, setDescription] = useState('');
  const [isCopilotRunning, setIsCopilotRunning] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<keyof typeof CATEGORY_CONFIG>('utility');
  const [urgency, setUrgency] = useState(3);
  const [aiDept, setAiDept] = useState('КП Хмельницькводоканал');
  const [showSecondWarning, setShowSecondWarning] = useState(false);
  const [submitPlan, setSubmitPlan] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProcessed, setAiProcessed] = useState(false);

  // Real duplicate detection: find an existing open incident whose address
  // roughly matches what was typed, then look for other open incidents within
  // DUPLICATE_RADIUS_METERS of it using actual lat/lng distance.
  const nearbyDuplicates = useMemo(() => {
    const query = normalizeAddress(address);
    if (query.length < 3) return [];

    const anchor = cityIncidents.find(
      inc => inc.status !== 'resolved' && normalizeAddress(inc.location).includes(query)
    );
    if (!anchor) return [];

    return cityIncidents.filter(
      inc => inc.status !== 'resolved' && distanceMeters(anchor.lat, anchor.lng, inc.lat, inc.lng) <= DUPLICATE_RADIUS_METERS
    );
  }, [address, cityIncidents]);

  const showDuplicateWarning = nearbyDuplicates.length > 0;

  useEffect(() => {
    if (!showDuplicateWarning) setShowSecondWarning(false);
  }, [showDuplicateWarning]);

  useEffect(() => {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setTimeFound(`Сьогодні, ${hrs}:${mins}`);
  }, []);

  useEffect(() => {
    if (address.trim().length > 1) {
      const match = KHMELNYTSKYI_STREETS.filter(s =>
        s.toLowerCase().includes(address.toLowerCase())
      );
      setFilteredStreets(match);
      setShowSuggestions(match.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [address]);

  const runAiCopilot = async () => {
    const raw = description.trim();
    if (!raw) return;
    setIsCopilotRunning(true);
    setAiError(null);
    try {
      const result = await classifyIncident(raw);
      setDescription(result.improvedText);
      setCategory(result.category);
      setAiDept(result.department);
      setUrgency(result.priority === 'critical' ? 5 : result.priority === 'high' ? 4 : result.priority === 'medium' ? 3 : 2);
      setAiProcessed(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Не вдалося отримати відповідь ШІ');
    } finally {
      setIsCopilotRunning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCloseOverlayAndAdd = () => {
    setSubmitPlan(false);
    const selectedCity = CITIES.find(c => c.id === cityId) || currentCity;
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      title: description.split('.')[0].slice(0, 60) || 'Новий інцидент',
      description: description || 'Скаргу зафіксовано та проаналізовано ШІ.',
      category,
      status: 'new',
      priority: urgency === 5 ? 'critical' : urgency >= 4 ? 'high' : urgency >= 2 ? 'medium' : 'low',
      location: address || 'Локація визначена за GPS',
      lat: selectedCity.lat + (Math.random() - 0.5) * 0.008,
      lng: selectedCity.lng + (Math.random() - 0.5) * 0.008,
      complaintsCount: 1,
      timeAgo: 'Щойно',
      department: aiDept,
      beforePhoto: photoPreview || undefined,
      aiProcessed,
    };

    if (user?.isLoggedIn) addPoints(10, `Інцидент: ${newIncident.title.slice(0, 30)}...`);
    onAddIncident(newIncident);
    onNavigateToMap();
  };

  const urgencyBars = [1, 2, 3, 4, 5];
  const urgencyColor = urgency >= 4 ? '#EF4444' : urgency >= 3 ? '#F59E0B' : 'var(--accent)';

  return (
    <div className="cs-scroll-page">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <h1 className="cs-page-title">Повідомити про проблему</h1>
        <p className="cs-page-subtitle">Опишіть ситуацію, а ШІ зробить все інше</p>

        {/* Form grid */}
        <div className="cs-report-grid" style={{ marginBottom: 24 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Location card */}
            <div className="cs-form-card">
              <div className="cs-form-card__title">📍 Локація та Час</div>

              {/* Address with autocomplete */}
              <div style={{ position: 'relative' }}>
                <label className="cs-form-label">Адреса ситуації</label>
                <input
                  className="cs-form-input"
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="вул. Проскурівська, 40"
                />
                {showSuggestions && (
                  <div className="cs-suggestions">
                    {filteredStreets.map(s => (
                      <button
                        key={s}
                        className="cs-suggestion-item"
                        onClick={() => { setAddress(s); setShowSuggestions(false); }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City & Time */}
              <div className="cs-form-grid-2">
                <div>
                  <label className="cs-form-label">Місто</label>
                  <select
                    className="cs-form-select"
                    value={cityId}
                    onChange={e => setCityId(e.target.value)}
                  >
                    {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="cs-form-label">Час виявлення</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      className="cs-form-input"
                      style={{ paddingLeft: 34 }}
                      type="text"
                      value={timeFound}
                      onChange={e => setTimeFound(e.target.value)}
                    />
                    <span style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }}>
                      <IconClock />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Media drag & drop */}
            <div className="cs-form-card">
              <div className="cs-form-card__title">📷 Фото того, що сталось</div>
              <div
                className="cs-dropzone"
                onClick={() => document.getElementById('report-file-input')?.click()}
              >
                {photoPreview ? (
                  <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden' }}>
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <>
                    <IconUpload />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Перетягніть фото сюди</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>або натисніть для вибору</span>
                  </>
                )}
              </div>
              <input id="report-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* AI Description */}
            <div className="cs-form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="cs-form-card__title">📝 Опис із ШІ-помічником</div>
                <button
                  onClick={runAiCopilot}
                  disabled={isCopilotRunning || !description.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 50,
                    fontSize: 11, fontWeight: 700,
                    background: 'rgba(0,242,254,0.12)',
                    border: '1px solid rgba(0,242,254,0.3)',
                    color: 'var(--accent)', cursor: 'pointer',
                    opacity: isCopilotRunning || !description.trim() ? 0.6 : 1,
                  }}
                >
                  <IconSparkles />
                  {isCopilotRunning ? 'Обробка...' : 'Покращити опис'}
                </button>
              </div>
              <textarea
                className="cs-form-textarea"
                value={description}
                onChange={e => { setDescription(e.target.value); setAiProcessed(false); }}
                placeholder="Опишіть своїми словами... (ШІ покращить та структурує опис)"
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                💡 Натисніть кнопку ШІ, щоб збагатити опис для комунальних служб
              </p>
              {aiError && (
                <p style={{ fontSize: 11, color: '#EF4444' }}>⚠️ Помилка ШІ: {aiError}</p>
              )}
            </div>

            {/* AI Classification — hybrid editable */}
            <div className="cs-ai-card">
              <div className="cs-ai-card__accent" />
              <div className="cs-ai-card__title">🤖 ШІ-класифікація (редагується)</div>

              <div className="cs-form-grid-2">
                <div>
                  <label className="cs-form-label">Категорія проблеми</label>
                  <select
                    className="cs-form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value as keyof typeof CATEGORY_CONFIG)}
                    style={{ color: CATEGORY_CONFIG[category].color }}
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="cs-form-label">Маршрутизація</label>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{aiDept}</p>
                </div>
              </div>

              {/* Urgency — fully manual */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label className="cs-form-label" style={{ marginBottom: 0 }}>Рівень екстреності</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: urgencyColor }}>{urgency} / 5</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {urgencyBars.map(step => (
                    <button
                      key={step}
                      onClick={() => setUrgency(step)}
                      style={{
                        flex: 1, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: step <= urgency ? urgencyColor : 'var(--border-color-strong)',
                        transition: 'background 0.2s ease',
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                  <span>Низький</span>
                  <span>Критичний</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deduplication warning */}
        {showDuplicateWarning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <div className="cs-dup-warning fade-in">
              <div>
                <span className="cs-dup-warning__title">⚠️ ДУБЛІКАТ ІНЦИДЕНТУ</span>
                <p className="cs-dup-warning__text">
                  У радіусі {DUPLICATE_RADIUS_METERS}м вже {nearbyDuplicates.length === 1 ? 'є 1 схожа заявка' : `є ${nearbyDuplicates.length} схожих заявок`}. Бажаєте додати свій голос до існуючої проблеми замість створення нової?
                </p>
              </div>
              <div className="cs-dup-warning__actions">
                <button
                  onClick={() => {
                    onJoinIncident(nearbyDuplicates[0].id);
                    onNavigateToMap();
                  }}
                  style={{ padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: '#F59E0B', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Доєднатися (+1)
                </button>
                <button
                  onClick={() => setShowSecondWarning(true)}
                  style={{ padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'transparent', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)', cursor: 'pointer' }}
                >
                  Додати ще один
                </button>
              </div>
            </div>

            {showSecondWarning && (
              <div className="cs-dup-confirm fade-in">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>Ви впевнені?</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Повторні заявки сповільнюють роботу комунальних служб.</p>
                </div>
                {nearbyDuplicates.slice(0, 3).map(dup => (
                  <div className="cs-dup-similar-card" key={dup.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>Подібна скарга поруч</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dup.timeAgo}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{dup.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Категорія: {CATEGORY_CONFIG[dup.category].label} · {dup.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit actions */}
        <div className="cs-actions-row">
          <button className="cs-btn-ghost" onClick={onNavigateToMap}>Скасувати</button>
          <button
            className="cs-btn-neon"
            onClick={() => setSubmitPlan(true)}
            disabled={!description.trim()}
          >
            <IconSparkles />
            Відправити на ШІ-аналіз
          </button>
        </div>
      </div>

      {/* AI post-submit modal */}
      {submitPlan && (
        <div className="cs-submit-overlay">
          <div className="cs-submit-backdrop" />
          <div className="cs-submit-card fade-in">
            <div style={{ textAlign: 'center' }}>
              <div className="cs-submit-check">✓</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#10B981', marginBottom: 4 }}>ШІ-аналіз завершено!</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Заявник: {user?.isLoggedIn ? user.name : 'Анонімно'}
              </p>
            </div>

            <div className="cs-submit-steps">
              <div className="cs-submit-step">
                <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>✅</span>
                <span>Проблему зафіксовано в системі.</span>
              </div>
              <div className="cs-submit-step">
                <span style={{ color: '#00F2FE', fontWeight: 700, flexShrink: 0 }}>🤖</span>
                <span>ШІ направив прямий тікет в КП "{aiDept}".</span>
              </div>
              <div className="cs-submit-step">
                <span style={{ color: '#F59E0B', fontWeight: 700, flexShrink: 0 }}>⏱</span>
                <span>Регламентний час реакції: 4 години.</span>
              </div>
              <div className="cs-submit-step">
                <span style={{ color: '#A855F7', fontWeight: 700, flexShrink: 0 }}>🏆</span>
                <span>Вам нараховано +10 балів еко-активіста.</span>
              </div>
            </div>

            <button className="cs-btn-neon" style={{ width: '100%' }} onClick={handleCloseOverlayAndAdd}>
              Надіслати повідомлення
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;
export type { ReportViewProps };
