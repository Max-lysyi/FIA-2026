import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import MobileView from './pages/MobileView';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

const App: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <ThemeProvider>
      <AuthProvider>
        {isMobile ? <MobileView /> : <Dashboard />}
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
