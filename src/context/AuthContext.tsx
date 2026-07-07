import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('citysense_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('citysense_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('citysense_user');
    }
  }, [user]);

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

  return (
    <AuthContext.Provider value={{ user, loginSimulate, logoutSimulate, addPoints }}>
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
