import React from 'react';
import CSLogo from './CSLogo';
import ThemeToggle from './ThemeToggle';
import {
  IconDashboard, IconMap, IconAnalytics, IconSettings, IconUser, IconSearch,
} from './Icons';

const IconReport: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
    className={`cs-nav-btn${isActive ? ' cs-nav-btn--active' : ''}`}
  >
    {isActive && <span className="cs-nav-btn__indicator" />}
    {children}
    <span className="cs-nav-btn__tooltip">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isFeedOpen, onFeedToggle }) => {
  return (
    <aside className="cs-sidebar cs-desktop-only">
      {/* Logo */}
      <div className="cs-sidebar__logo">
        <CSLogo size={42} />
      </div>

      {/* Top navigation */}
      <nav className="cs-sidebar__nav">
        <NavBtn isActive={isFeedOpen} onClick={onFeedToggle} label="Дашборд">
          <IconDashboard size={20} color={isFeedOpen ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        <NavBtn isActive={activeView === 'map'} onClick={() => onViewChange('map')} label="Карта">
          <IconMap size={20} color={activeView === 'map' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        <NavBtn isActive={activeView === 'report'} onClick={() => onViewChange('report')} label="Повідомити про проблему">
          <IconReport size={20} color={activeView === 'report' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        <NavBtn isActive={activeView === 'analytics'} onClick={() => onViewChange('analytics')} label="Аналітика">
          <IconAnalytics size={20} color={activeView === 'analytics' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        <NavBtn isActive={false} onClick={() => {}} label="Пошук">
          <IconSearch size={20} color="var(--text-muted)" />
        </NavBtn>
      </nav>

      {/* Divider */}
      <div className="cs-sidebar__divider" />

      {/* Bottom group */}
      <div className="cs-sidebar__bottom">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <ThemeToggle compact />
        </div>

        <NavBtn isActive={activeView === 'profile'} onClick={() => onViewChange('profile')} label="Мій акаунт">
          <IconUser size={20} color={activeView === 'profile' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>

        <NavBtn isActive={activeView === 'settings'} onClick={() => onViewChange('settings')} label="Налаштування">
          <IconSettings size={20} color={activeView === 'settings' ? '#00F2FE' : 'var(--text-muted)'} />
        </NavBtn>
      </div>
    </aside>
  );
};

export default Sidebar;
export type { SidebarProps };
