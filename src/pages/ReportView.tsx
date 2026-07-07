import React, { useState, useEffect } from 'react';
import { CATEGORY_CONFIG, type Incident, type City, CITIES } from '../data/incidents';
import { useAuth } from '../context/AuthContext';

interface ReportViewProps {
  currentCity: City;
  onAddIncident: (incident: Incident) => void;
  onNavigateToMap: () => void;
}

// Sparkles SVG Icon
const IconSparkles = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.3-6.3l-.7.7M6.7 17.3l-.7.7m12.6 0l-.7-.7M6.7 6.7l-.7-.7M10 8.5L12 6l2 2.5L16.5 8l-2.5 2L15 12.5l-3-2-3 2 .5-2.5L7 8l3 .5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClock = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconUpload = () => (
  <svg className="w-10 h-10 mb-3 text-cyan-400 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 6 varied AI co-pilot templates
const AI_COPILOT_TEMPLATES = [
  'Зафіксовано аварійну ситуацію на дорожньому покритті: глибока вибоїна створює безпосередню загрозу пошкодження коліс транспортних засобів та може спровокувати ДТП. Потрібен терміновий точковий ремонт.',
  'Виявлено прорив мережі водопостачання. Вода під тиском розмиває ґрунт біля тротуару та підтоплює прилеглу територію. Запах хлору відсутній. Потрібно перекрити ділянку та замінити трубу.',
  'У зеленій зоні зафіксовано велику аварійну гілку, яка тріснула та зависла над пішохідною доріжкою. Є загроза падіння на перехожих при поривах вітру. Необхідно провести санітарне обрізання дерева.',
  'На перехресті вийшов з ладу світлофорний об’єкт, через що утворився тривалий затор та аварійні ситуації для пішоходів. Необхідно направити екіпаж регулювальників та провести ремонт контролера.',
  'Спостерігається сильне задимлення та специфічний хімічний запах з боку прилеглої промислової зони. Можливе несанкціоноване спалювання відходів або викид фільтрату. Потрібен екологічний замір.',
  'На прибудинковій території виявлено значне накопичення побутового та будівельного сміття поза межами сміттєвих баків. Засмічення створює антисанітарні умови та заважає проїзду спецтранспорту.'
];

// Khmelnytskyi streets for suggestion auto-fill
const KHMELNYTSKYI_STREETS = [
  'вул. Проскурівська',
  'вул. Кам’янецька',
  'вул. Подільська',
  'вул. Свободи',
  'вул. Озерна',
  'вул. Зарічанська',
  'вул. Соборна',
  'вул. Грушевського'
];

const ReportView: React.FC<ReportViewProps> = ({ currentCity, onAddIncident, onNavigateToMap }) => {
  const { user, addPoints } = useAuth();

  const [address, setAddress] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStreets, setFilteredStreets] = useState<string[]>([]);
  const [cityId, setCityId] = useState(CITIES.find(c => c.id === 'khmelnytskyi')?.id ?? currentCity.id);
  const [timeFound, setTimeFound] = useState('');
  const [description, setDescription] = useState('');
  const [isCopilotRunning, setIsCopilotRunning] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Manual & AI changeable categories / urgency
  const [category, setCategory] = useState<'ecology' | 'critical' | 'transport' | 'utility' | 'infrastructure'>('utility');
  const [urgency, setUrgency] = useState(3);
  const [aiDept, setAiDept] = useState('КП Хмельницькводоканал');

  // Warning & Confirmation
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showSecondWarning, setShowSecondWarning] = useState(false);
  const [submitPlan, setSubmitPlan] = useState(false);

  // Auto time lock
  useEffect(() => {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setTimeFound(`Сьогодні, ${hrs}:${mins}`);
  }, []);

  // Filter streets autocomplete
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

  // Simulate duplicate check on street change
  useEffect(() => {
    if (address.includes('Проскурівська') || address.includes('Кам’янецька')) {
      setShowDuplicateWarning(true);
    } else {
      setShowDuplicateWarning(false);
      setShowSecondWarning(false);
    }
  }, [address]);

  // Dynamic AI Suggestions (that user can edit!)
  useEffect(() => {
    const desc = description.toLowerCase();
    if (desc.includes('вод') || desc.includes('труб') || desc.includes('прорив')) {
      setCategory('utility');
      setAiDept(cityId === 'khmelnytskyi' ? 'КП Хмельницькводоканал' : 'Міськводоканал');
      setUrgency(4);
    } else if (desc.includes('аварі') || desc.includes('дерев') || desc.includes('критич') || desc.includes('дснс')) {
      setCategory('critical');
      setAiDept('Служба ДСНС');
      setUrgency(5);
    } else if (desc.includes('дорог') || desc.includes('світлофор') || desc.includes('затор') || desc.includes('яма')) {
      setCategory('transport');
      setAiDept('Служба автомобільних доріг');
      setUrgency(3);
    } else if (desc.includes('смітт') || desc.includes('еколог') || desc.includes('вируб')) {
      setCategory('ecology');
      setAiDept('Екологічний інспектор');
      setUrgency(4);
    }
  }, [description, cityId]);

  // AI Copilot Expand function
  const runAiCopilot = () => {
    setIsCopilotRunning(true);
    setTimeout(() => {
      // Pick random template from templates
      const randomIdx = Math.floor(Math.random() * AI_COPILOT_TEMPLATES.length);
      setDescription(AI_COPILOT_TEMPLATES[randomIdx]);
      setIsCopilotRunning(false);
    }, 900);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFinalSubmit = () => {
    setSubmitPlan(true);
  };

  const handleCloseOverlayAndAdd = () => {
    setSubmitPlan(false);

    // Dynamic Geocoding Simulation (coordinates near city center)
    const selectedCity = CITIES.find(c => c.id === cityId) || currentCity;
    const offsetLat = (Math.random() - 0.5) * 0.008;
    const offsetLng = (Math.random() - 0.5) * 0.008;

    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      title: description.split('.')[0] || 'Новий інцидент',
      description: description || 'Скаргу зафіксовано та проаналізовано ШІ.',
      category: category,
      status: 'new',
      priority: urgency === 5 ? 'critical' : urgency >= 4 ? 'high' : urgency >= 2 ? 'medium' : 'low',
      location: address || 'Локація визначена за GPS',
      lat: selectedCity.lat + offsetLat,
      lng: selectedCity.lng + offsetLng,
      complaintsCount: 1,
      timeAgo: 'Щойно',
      department: aiDept,
      beforePhoto: photoPreview || 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop',
    };

    // Add points if user is logged in
    if (user?.isLoggedIn) {
      addPoints(10, `Створення інциденту: ${newIncident.title.slice(0, 30)}...`);
    }

    onAddIncident(newIncident);
    onNavigateToMap();
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-8 md:px-12 md:py-10 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Повідомити про проблему
          </h1>
          <p className="text-sm opacity-75" style={{ color: 'var(--text-secondary)' }}>
            Опишіть ситуацію, а ШІ зробить все інше
          </p>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            
            {/* Location & Time Card */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-base font-bold flex items-center gap-2">
                📍 Локація та Час
              </h2>
              
              {/* Address with autocomplete suggestions */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Адреса
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="вул. Проскурівська, 40"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border bg-[var(--bg-secondary)]"
                  style={{ borderColor: 'var(--border-color-strong)' }}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div
                    className="absolute z-50 top-[calc(100%+4px)] left-0 w-full rounded-xl overflow-hidden border shadow-lg flex flex-col"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color-strong)' }}
                  >
                    {filteredStreets.map((street) => (
                      <button
                        key={street}
                        onClick={() => {
                          setAddress(street);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--bg-glass-hover)] transition-colors"
                      >
                        {street}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City & Time Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Місто
                  </label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border bg-[var(--bg-secondary)]"
                    style={{ borderColor: 'var(--border-color-strong)' }}
                  >
                    {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Час виявлення
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={timeFound}
                      onChange={(e) => setTimeFound(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none border bg-[var(--bg-secondary)]"
                      style={{ borderColor: 'var(--border-color-strong)' }}
                    />
                    <div className="absolute left-3 pointer-events-none text-[var(--text-muted)]">
                      <IconClock />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drag & Drop Photo */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-base font-bold">
                📷 Фото того, що сталось
              </h2>
              <div
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-cyan-400 bg-[var(--bg-secondary)]"
                style={{ borderColor: 'var(--border-color-strong)' }}
                onClick={() => document.getElementById('file-upload-dialog')?.click()}
              >
                {photoPreview ? (
                  <div className="w-full h-32 rounded-lg overflow-hidden">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <>
                    <IconUpload />
                    <span className="text-sm font-semibold">Перетягніть фото сюди</span>
                    <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>або натисніть для вибору</span>
                  </>
                )}
              </div>
              <input
                id="file-upload-dialog"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            
            {/* Description Card */}
            <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold">
                  📝 Опис із ШІ-помічником
                </h2>
                <button
                  onClick={runAiCopilot}
                  disabled={isCopilotRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border bg-[rgba(0,242,254,0.12)] border-[rgba(0,242,254,0.3)] text-[var(--accent)]"
                >
                  <IconSparkles />
                  {isCopilotRunning ? 'Обробка...' : 'Покращити опис'}
                </button>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишіть своїми словами... (ШІ покращить та зробить опис структурованим)"
                rows={5}
                className="w-full p-4 rounded-xl text-sm outline-none border bg-[var(--bg-secondary)]"
                style={{ borderColor: 'var(--border-color-strong)' }}
              />
            </div>

            {/* Hybrid AI & User Classification Card */}
            <div
              className="glass-card p-6 rounded-2xl flex flex-col gap-5 border relative overflow-hidden"
              style={{ borderColor: 'rgba(0,242,254,0.3)', boxShadow: '0 0 16px rgba(0,242,254,0.08)' }}
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-400 via-indigo-500 to-rose-400" />
              
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                🤖 ШІ-класифікація (Редагується)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Dropdown (Fully editable) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Категорія проблеми</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold outline-none border bg-[var(--bg-secondary)]"
                    style={{ borderColor: 'var(--border-color-strong)', color: CATEGORY_CONFIG[category].color }}
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                {/* Responsible service (read-only info) */}
                <div>
                  <span className="text-xs block mb-1.5" style={{ color: 'var(--text-muted)' }}>Маршрутизація</span>
                  <span className="text-xs font-bold block mt-1" style={{ color: 'var(--text-primary)' }}>
                    {aiDept}
                  </span>
                </div>
              </div>

              {/* Urgency Slider (fully editable) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Рівень екстреності</span>
                  <span className="text-xs font-bold text-rose-500">{urgency} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={urgency}
                  onChange={(e) => setUrgency(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(urgency - 1) / 4 * 100}%, var(--border-color) ${(urgency - 1) / 4 * 100}%, var(--border-color) 100%)`,
                    WebkitAppearance: 'none',
                  }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* Deduplication Warnings */}
        {showDuplicateWarning && (
          <div className="flex flex-col gap-3">
            {/* Warning bar */}
            <div
              className="p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: '#F59E0B' }}
            >
              <div className="flex-1">
                <span className="text-xs font-extrabold uppercase tracking-wider block mb-1">⚠️ ДУБЛІКАТ ІНЦИДЕНТУ</span>
                <p className="text-xs opacity-90 leading-relaxed">
                  У радіусі 100м вже є 2 схожі заявки за сьогодні. Бажаєте додати свій голос до існуючої проблеми замість створення нової?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigateToMap()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F59E0B] text-white"
                >
                  Доєднатися (+1)
                </button>
                <button
                  onClick={() => setShowSecondWarning(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-transparent border border-orange-500/40 text-orange-500"
                >
                  Додати ще один
                </button>
              </div>
            </div>

            {/* Secondary verification check */}
            {showSecondWarning && (
              <div
                className="p-5 rounded-xl border flex flex-col gap-4 fade-in"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
              >
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-red-500">Ви впевнені?</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Повторні заявки сповільнюють роботу комунальних служб.</p>
                </div>

                {/* Similar incident details card */}
                <div
                  className="p-4 rounded-xl flex flex-col gap-2"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-500">Подібна скарга поруч</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Сьогодні, 10:45</span>
                  </div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Зламане дерево заблокувало пішохідний перехід
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Категорія: Критично · вул. Проскурівська, 42
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Action buttons */}
        <div className="flex gap-4 justify-end pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onNavigateToMap}
            className="px-6 py-3 rounded-xl text-xs font-bold border transition-all bg-[var(--bg-glass)]"
            style={{ borderColor: 'var(--border-color-strong)' }}
          >
            Скасувати
          </button>
          <button
            onClick={handleFinalSubmit}
            disabled={!description.trim()}
            className="btn-neon px-8 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <IconSparkles />
            Відправити на ШІ-аналіз
          </button>
        </div>

      </div>

      {/* Final AI post-submit simulation modal */}
      {submitPlan && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
          
          <div
            className="relative glass-card p-8 rounded-3xl w-full max-w-md border fade-in flex flex-col gap-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'rgba(0,242,254,0.3)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
            }}
          >
            <div className="text-center flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  border: '1.5px solid #10B981',
                  boxShadow: '0 0 20px rgba(16,185,129,0.3)'
                }}
              >
                ✓
              </div>
              <h3 className="text-lg font-bold text-emerald-400">ШІ-аналіз успішно завершено!</h3>
              <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--text-muted)' }}>
                Заявник: {user?.isLoggedIn ? user.name : 'Анонімно'}
              </p>
            </div>

            <div
              className="p-4 rounded-xl flex flex-col gap-3.5 text-sm"
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✅</span>
                <span>Проблему зафіксовано.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-cyan-400 font-bold">🤖</span>
                <span>ШІ направив прямий тікет в КП "Управління інфраструктури"</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-amber-500 font-bold">⏱</span>
                <span>Регламентний час реакції: 4 години.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-purple-400 font-bold">🏆</span>
                <span>Вам нараховано +10 балів еко-активіста.</span>
              </div>
            </div>

            <button
              onClick={handleCloseOverlayAndAdd}
              className="btn-neon w-full py-3.5 rounded-xl text-xs font-bold tracking-wider"
            >
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
