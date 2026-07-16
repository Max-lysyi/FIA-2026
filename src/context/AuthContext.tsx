import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ─── Types ─────────────────────────────────── */
export interface MockUser {
  id: string;
  name: string;
  points: number;
  avatar: string; // 2-letter initials
}

export interface UserSession {
  name: string;
  points: number;
  isLoggedIn: boolean;
  history: { date: string; points: number; reason: string }[];
}

interface AuthContextType {
  user: UserSession | null;
  loginSimulate: (name: string) => void;
  logoutSimulate: () => void;
  addPoints: (amount: number, reason: string) => void;
  getMockUsers: () => MockUser[];
  getUserRank: () => number;
}

/* ─── Mock database seed ──────────────────────── */
const MOCK_NAMES = [
  'Олександр Коваль', 'Марія Шевченко', 'Андрій Бондаренко', 'Ірина Ткаченко',
  'Дмитро Мельник', 'Тетяна Кравченко', 'Василь Петренко', 'Юлія Романенко',
  'Сергій Поліщук', 'Наталія Савченко', 'Михайло Литвиненко', 'Оксана Гончарук',
  'Ігор Зайченко', 'Ольга Марченко', 'Богдан Руденко', 'Катерина Приходько',
  'Віталій Сидоренко', 'Анна Дубовик', 'Роман Кузьменко', 'Людмила Тарасенко',
];

const LS_LEADERBOARD = 'citysense_leaderboard';
const LS_USER = 'citysense_user';

function generateMockUsers(): MockUser[] {
  return MOCK_NAMES.map((name, i) => ({
    id: `mock-${i}`,
    name,
    points: Math.floor(Math.random() * 451) + 50, // 50..500
    avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
  }));
}

function loadOrCreateMockUsers(): MockUser[] {
  const saved = localStorage.getItem(LS_LEADERBOARD);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* regenerate */ }
  }
  const users = generateMockUsers();
  localStorage.setItem(LS_LEADERBOARD, JSON.stringify(users));
  return users;
}

/* ─── Context ─────────────────────────────────── */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem(LS_USER);
    return saved ? JSON.parse(saved) : null;
  });

  // Ensure mock users exist on first mount
  const [mockUsers] = useState<MockUser[]>(() => loadOrCreateMockUsers());

  useEffect(() => {
    if (user) {
      localStorage.setItem(LS_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(LS_USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LS_LEADERBOARD, JSON.stringify(mockUsers));
  }, [mockUsers]);

  const loginSimulate = (name: string) => {
    setUser({
      name,
      points: 120,
      isLoggedIn: true,
      history: [
        { date: '04.07.2026', points: 50, reason: 'Реєстрація у системі' },
        { date: '05.07.2026', points: 30, reason: 'Скарга на незаконне паркування' },
        { date: '06.07.2026', points: 40, reason: 'Підтвердження вирішення інциденту' },
      ]
    });
  };

  const logoutSimulate = () => {
    setUser(null);
  };

  const addPoints = (amount: number, reason: string) => {
    if (!user) return;
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: prev.points + amount,
        history: [
          { date: formattedDate, points: amount, reason },
          ...prev.history
        ]
      };
    });
  };

  const getMockUsers = useCallback((): MockUser[] => {
    return mockUsers;
  }, [mockUsers]);

  const getUserRank = useCallback((): number => {
    if (!user) return -1;
    const allUsers = [...mockUsers, { id: 'current', name: user.name, points: user.points, avatar: '' }];
    allUsers.sort((a, b) => b.points - a.points);
    const idx = allUsers.findIndex(u => u.id === 'current');
    return idx + 1; // 1-based rank
  }, [mockUsers, user]);

  return (
    <AuthContext.Provider value={{ user, loginSimulate, logoutSimulate, addPoints, getMockUsers, getUserRank }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
