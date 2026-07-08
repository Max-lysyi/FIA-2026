import React from 'react';
import { useTheme } from '../context/ThemeContext';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ThemeToggleProps {
  compact?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { toggleTheme, isDark } = useTheme();

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        title={isDark ? 'Світла тема' : 'Темна тема'}
        style={{
          width: 42, height: 42, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
          border: isDark ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(99,102,241,0.3)',
          color: isDark ? '#F59E0B' : '#6366F1',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Світла тема' : 'Темна тема'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 50,
        fontSize: 12, fontWeight: 600,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        border: '1px solid var(--border-color-strong)',
        color: isDark ? '#F59E0B' : '#6366F1',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span style={{ display: 'none' }} className="theme-label">{isDark ? 'Світла' : 'Темна'}</span>
    </button>
  );
};

export default ThemeToggle;
