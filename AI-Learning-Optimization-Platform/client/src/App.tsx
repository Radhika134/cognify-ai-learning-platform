import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import StudyPlans from './pages/StudyPlans';
import Analytics from './pages/Analytics';
import Sidebar from './components/Sidebar';
import { getMe } from './services/api';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) { setAuthLoading(false); return; }
      try {
        const res = await getMe();
        setUserName(res.data.name);
        setUserEmail(res.data.email);
        localStorage.setItem('userName', res.data.name);
        localStorage.setItem('userEmail', res.data.email);
      } catch {
        // Token invalid, log out
        handleLogout();
      } finally {
        setAuthLoading(false);
      }
    };
    validateToken();
  }, []);

  const handleLoginSuccess = (newToken: string, name: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userName', name);
    setToken(newToken);
    setUserName(name);
    // Fetch full user info
    getMe().then(res => {
      setUserEmail(res.data.email);
      localStorage.setItem('userEmail', res.data.email);
    }).catch(() => { });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUserName('');
    setUserEmail('');
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }}></div>
      </div>
    );
  }

  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar userName={userName} userEmail={userEmail} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard userName={userName} />} />
            <Route path="/study-plans" element={<StudyPlans />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
