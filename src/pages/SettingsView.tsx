import React from 'react';

const SettingsView: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto px-8 py-8 md:px-12 md:py-10 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Налаштування</h1>
          <p className="text-sm opacity-75" style={{ color: 'var(--text-secondary)' }}>
            Налаштуйте систему інтелектуального моніторингу під власні потреби
          </p>
        </div>

        {/* Configurations Card */}
        <div className="glass-card p-6 rounded-2xl border flex flex-col gap-5" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <span className="text-sm font-bold block">🤖 ШІ-класифікація скарг</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Автоматичний розбір звернень у реальному часі</span>
            </div>
            <input type="checkbox" defaultChecked className="w-9 h-5 rounded-full cursor-pointer" />
          </div>

          <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <span className="text-sm font-bold block">🔔 Push-сповіщення про дублікати</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Надсилати сповіщення при знаходженні подібних заяв поруч</span>
            </div>
            <input type="checkbox" defaultChecked className="w-9 h-5 rounded-full cursor-pointer" />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-bold block">🌍 Мова інтерфейсу</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Обрати основну локаль сайту</span>
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Українська</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;
