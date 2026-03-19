import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import AuthPage from './pages/AuthPage';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import StudyPlans from './pages/StudyPlans';
import Analytics from './pages/Analytics';

import AiTutor from './pages/AiTutor';
import QuizGenerator from './pages/QuizGenerator';
import StudyPlanGenerator from './pages/StudyPlanGenerator';
import NotesSummarizer from './pages/NotesSummarizer';
import ConceptExplainer from './pages/ConceptExplainer';
import ProgressCoach from './pages/ProgressCoach';

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="dot"></div><div className="dot"></div><div className="dot"></div>
      </div>
    );
  }

  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <Layout userName={userName} userEmail={userEmail} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard userName={userName} />} />
          <Route path="/study-plans" element={<StudyPlans />} />
          <Route path="/analytics" element={<Analytics />} />
          
          <Route path="/ai/tutor" element={<AiTutor />} />
          <Route path="/ai/quiz" element={<QuizGenerator />} />
          <Route path="/ai/plan-generator" element={<StudyPlanGenerator />} />
          <Route path="/ai/notes" element={<NotesSummarizer />} />
          <Route path="/ai/explainer" element={<ConceptExplainer />} />
          <Route path="/ai/coach" element={<ProgressCoach />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
