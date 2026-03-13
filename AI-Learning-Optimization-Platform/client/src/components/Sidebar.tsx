import { NavLink } from 'react-router-dom';

interface Props {
    userName: string;
    userEmail: string;
    onLogout: () => void;
}

export default function Sidebar({ userName, userEmail, onLogout }: Props) {
    const navItems = [
        { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
        { to: '/study-plans', icon: '📚', label: 'Study Plans' },
        { to: '/analytics', icon: '📊', label: 'Analytics' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <h1>🧠 Cognify</h1>
                <span>Optimize the way you learn.</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                        <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
                    </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ width: '100%', marginTop: '8px' }}>
                    🚪 Sign Out
                </button>
            </div>
        </aside>
    );
}
