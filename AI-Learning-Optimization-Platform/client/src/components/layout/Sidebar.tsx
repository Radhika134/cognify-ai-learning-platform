import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
    userName: string;
    userEmail: string;
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const NavItem = ({ icon, label, to, collapsed, onClick }: {
  icon: React.ReactNode, label: string, to: string, collapsed: boolean, onClick?: () => void
}) => {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to)

  return (
    <Link to={to} style={{ textDecoration: 'none' }} onClick={onClick}>
      <button className={`nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">{icon}</span>
        <span className="nav-label-text">{label}</span>
        {isActive && <span className="nav-dot" />}
        <span className="nav-tooltip">{label}</span>
      </button>
    </Link>
  )
}

export default function Sidebar({ userName, userEmail, onLogout, isOpen, onClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true'
    });

    const toggleSidebar = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebar-collapsed', String(next));
    };

    // Keyboard shortcut Ctrl+B
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [collapsed]);
    
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'sidebar-open' : ''}`}>

            {/* Toggle button — sits on border edge */}
            <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle sidebar (Ctrl+B)">
                <span className="toggle-arrow">{collapsed ? '›' : '‹'}</span>
            </button>
            
            {/* Mobile close button */}
            {isOpen && (
                <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
            )}

            {/* Logo */}
            <div className="logo-area">
                <div className="logo-gem">✦</div>
                <div className="logo-texts">
                    <div className="logo-name">Cognify</div>
                    <div className="logo-sub">AI Learning Platform</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="nav-wrap">
                <div className="nav-label">Overview</div>
                <NavItem icon="🏠" label="Dashboard" to="/dashboard" collapsed={collapsed} onClick={handleNavClick} />
                <NavItem icon="📚" label="Study Plans" to="/study-plans" collapsed={collapsed} onClick={handleNavClick} />
                <NavItem icon="📊" label="Analytics" to="/analytics" collapsed={collapsed} onClick={handleNavClick} />

                <div className="nav-label" style={{ marginTop: 12 }}>AI Features</div>
                <NavItem icon="💬" label="AI Tutor" to="/ai/tutor" collapsed={collapsed} onClick={handleNavClick} />
                <NavItem icon="🎯" label="Quiz Generator" to="/ai/quiz" collapsed={collapsed} onClick={handleNavClick} />
                <NavItem icon="✨" label="Study Planner" to="/ai/plan-generator" collapsed={collapsed} onClick={handleNavClick} />
                <NavItem icon="📝" label="Notes Summarizer" to="/ai/notes" collapsed={collapsed} onClick={handleNavClick} />
                <NavItem icon="💡" label="Concept Explainer" to="/ai/explainer" collapsed={collapsed} onClick={handleNavClick} />
                <NavItem icon="🏆" label="Progress Coach" to="/ai/coach" collapsed={collapsed} onClick={handleNavClick} />
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="user-card" title={userEmail}>
                    <div className="user-avatar">{getInitials(userName)}</div>
                    <div className="user-card-texts">
                        <div className="user-name">{userName || 'User'}</div>
                        <div className="user-level">✦ Lv.1 · 45 XP</div>
                    </div>
                </div>
                <button className="sign-out-btn" onClick={onLogout}>Sign out</button>
            </div>
            
        </aside>
    );
}
