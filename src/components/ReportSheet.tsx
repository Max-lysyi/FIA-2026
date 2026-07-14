import React, { useState, useRef, useEffect } from 'react';
import { CATEGORY_CONFIG, type IncidentCategory } from '../data/incidents';
import { classifyIncident } from '../lib/ai';

interface ReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportData) => void;
}

export interface ReportData {
  text: string;
  category: IncidentCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  location: string;
}

type AIStep = 'idle' | 'typing' | 'analyzing' | 'done' | 'error';

const ReportSheet: React.FC<ReportSheetProps> = ({ isOpen, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [aiStep, setAiStep] = useState<AIStep>('idle');
  const [result, setResult] = useState<ReportData | null>(null);
  const [isInputActive, setIsInputActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    } else {
      setText('');
      setAiStep('idle');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setAiStep('analyzing');
    setError(null);

    try {
      const { category, priority, department, improvedText } = await classifyIncident(text);

      const reportData: ReportData = {
        text: improvedText,
        category,
        priority,
        department,
        location: 'Вінниця (автовизначення)',
      };

      setResult(reportData);
      setAiStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося отримати відповідь ШІ');
      setAiStep('error');
    }
  };

  const handleFinalSubmit = () => {
    if (result) {
      onSubmit(result);
      onClose();
    }
  };

  if (!isOpen) return null;

  const PRIORITY_LABELS = { low: 'Низький', medium: 'Середній', high: 'Високий', critical: 'Критичний' };
  const PRIORITY_COLORS = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet px-5 pt-3 pb-8">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--border-color-strong)' }} />

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #00F2FE22, #3B82F622)', border: '1px solid var(--border-color-strong)' }}
          >
            📣
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Сповістити про проблему
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ШІ автоматично класифікує та направить скаргу
            </p>
          </div>
        </div>

        {aiStep === 'idle' && (
          <>
            {/* Input */}
            <div className={`ai-input-wrapper mb-4 ${isInputActive ? 'active' : ''}`}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onFocus={() => setIsInputActive(true)}
                onBlur={() => setIsInputActive(false)}
                placeholder="Опишіть, що сталося... (наприклад: 'Сильно смердить хімією біля Південного Бугу')"
                rows={4}
                className="w-full p-4 rounded-xl resize-none text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="btn-neon w-full py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              ✨ Аналізувати за допомогою ШІ
            </button>
          </>
        )}

        {aiStep === 'analyzing' && (
          <div className="flex flex-col items-center gap-4 py-6">
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px solid var(--border-color)',
                  borderTopColor: 'var(--accent)',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div className="absolute inset-2 flex items-center justify-center text-2xl">
                🤖
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-center mb-1" style={{ color: 'var(--accent)' }}>
                ШІ аналізує текст...
              </p>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Класифікація категорії та пріоритету
              </p>
            </div>

            {/* Token animation */}
            <div
              className="w-full p-3 rounded-xl text-xs leading-relaxed font-mono"
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--accent)' }}
            >
              {text.split(' ').map((word, i) => (
                <span
                  key={i}
                  className="inline-block mr-1"
                  style={{ animation: `tokenize 0.6s ease ${i * 0.08}s forwards`, opacity: 1 }}
                >
                  [{word}]
                </span>
              ))}
            </div>
          </div>
        )}

        {aiStep === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div
              className="w-full p-4 rounded-xl text-sm"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
            >
              ⚠️ Помилка ШІ-аналізу: {error}
            </div>
            <button onClick={handleSubmit} className="btn-neon w-full py-3 text-sm font-bold">
              🔄 Спробувати ще раз
            </button>
          </div>
        )}

        {aiStep === 'done' && result && (
          <div className="ai-result-card flex flex-col gap-3">
            {/* Success header */}
            <div
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#10B981' }}>ШІ успішно класифікував</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Скаргу буде направлено автоматично</p>
              </div>
            </div>

            {/* Result grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Категорія</p>
                <span
                  className="badge"
                  style={{
                    background: CATEGORY_CONFIG[result.category].bgColor,
                    color: CATEGORY_CONFIG[result.category].color,
                    border: `1px solid ${CATEGORY_CONFIG[result.category].borderColor}`,
                  }}
                >
                  {CATEGORY_CONFIG[result.category].label}
                </span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Пріоритет</p>
                <span
                  className="badge"
                  style={{
                    background: `${PRIORITY_COLORS[result.priority]}20`,
                    color: PRIORITY_COLORS[result.priority],
                    border: `1px solid ${PRIORITY_COLORS[result.priority]}40`,
                  }}
                >
                  {PRIORITY_LABELS[result.priority]}
                </span>
              </div>
              <div className="p-3 rounded-xl col-span-2" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Направлено до</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>→ {result.department}</p>
              </div>
              <div className="p-3 rounded-xl col-span-2" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>📍 Локація</p>
                <p className="text-sm" style={{ color: 'var(--accent)' }}>{result.location}</p>
              </div>
            </div>

            {/* Confirm */}
            <button onClick={handleFinalSubmit} className="btn-neon w-full py-3 text-sm font-bold mt-1">
              📤 Надіслати скаргу
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ReportSheet;
