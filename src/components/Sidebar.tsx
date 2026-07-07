import React from 'react';
import CSLogo from './CSLogo';
import ThemeToggle from './ThemeToggle';
import {
  IconDashboard, IconMap, IconAnalytics,
  IconSettings, IconUser, IconSearch,
} from './Icons';

// Simple House icon for Report Problem
const IconReport: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12h6v10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="1" fill={color} />
  </svg>
);

export type SidebarView = 'map' | 'report' | 'analytics' | 'profile' | 'settings';

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  isFeedOpen: boolean;
  onFeedToggle: () => void;
}

interface NavBtnProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

const NavBtn: React.FC<NavBtnProps> = ({ isActive, onClick, label, children }) => (
  <button
    onClick={onClick}
    title={label}
    className="relative group w-full h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
    style={{
      background: isActive ? 'rgba(0,242,254,0.13)' : 'transparent',
      border: isActive ? '1px solid rgba(0,242,254,0.35)' : '1px solid transparent',
      boxShadow: isActive ? '0 0 16px rgba(0,242,254,0.18) inset' : 'none',
    }}
  >
    {/* Left active indicator */}
    {isActive && (
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
        style={{ background: '#00F2FE', boxShadow: '0 0 8px #00F2FE' }}
      />
    )}
    {children}
    {/* Tooltip */}
    <span
      className="absolute left-[calc(100%+10px)] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap z-50
                 opacity-0 group-hover:opacity-100 pointer-events-none
                 transition-all duration-150 translate-x-[-4px] group-hover:translate-x-0"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color-strong)',
        color: 'var(--text-primary)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {label}
    </span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isFeedOpen, onFeedToggle }) => {
  return (
    <aside
      className="flex flex-col items-center py-4 z-30 flex-shrink-0"
      style={{
        width: 68,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-color)',
        gap: 0,
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="mb-6 mt-1 flex-shrink-0 flex items-center justify-center">
        <CSLogo size={42} />
      </div>

      {/* ── Top navigation group ─────────────────────────────────── */}
      <nav className="flex flex-col gap-2 w-full px-3 flex-1">

        {/* 1. Dashboard — toggle feed */}
        <NavBtn
          isActive={isFeedOpen}
          onClick={onFeedToggle}
          label="Дашборд"
        >
          <IconDashboard size={20} color={isFeedOpen ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        {/* 2. Map */}
        <NavBtn
          isActive={activeView === 'map'}
          onClick={() => onViewChange('map')}
          label="Карта"
        >
          <IconMap size={20} color={activeView === 'map' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        {/* 3. Report Problem */}
        <NavBtn
          isActive={activeView === 'report'}
          onClick={() => onViewChange('report')}
          label="Повідомити про проблему"
        >
          <IconReport size={20} color={activeView === 'report' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        {/* 4. Analytics */}
        <NavBtn
          isActive={activeView === 'analytics'}
          onClick={() => onViewChange('analytics')}
          label="Аналітика"
        >
          <IconAnalytics size={20} color={activeView === 'analytics' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        {/* 5. Search — last in top group */}
        <NavBtn
          isActive={false}
          onClick={() => {}}
          label="Пошук"
        >
          <IconSearch size={20} color="var(--text-muted)" />
        </NavBtn>
      </nav>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="w-8 my-3 flex-shrink-0" style={{ height: 1, background: 'var(--border-color)' }} />

      {/* ── Bottom group ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 w-full px-3 pb-3 flex-shrink-0">

        {/* 6. Theme Toggle */}
        <div className="flex items-center justify-center py-1">
          <ThemeToggle compact />
        </div>

        {/* 7. User Account */}
        <NavBtn
          isActive={activeView === 'profile'}
          onClick={() => onViewChange('profile')}
          label="Мій акаунт"
        >
          <IconUser size={20} color={activeView === 'profile' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        {/* 8. Settings */}
        <NavBtn
          isActive={activeView === 'settings'}
          onClick={() => onViewChange('settings')}
          label="Налаштування"
        >
          <IconSettings size={20} color={activeView === 'settings' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>
      </div>
    </aside>
  );
};

export default Sidebar;
export type { SidebarProps };
