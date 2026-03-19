import { useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: ReactNode;
    userName: string;
    userEmail: string;
    onLogout: () => void;
}

export default function Layout({ children, userName, userEmail, onLogout }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-container">
            {/* Background orbs */}
            <div className="bg-orbs" aria-hidden="true">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
                <div className="orb orb-4" />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar
                userName={userName}
                userEmail={userEmail}
                onLogout={onLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="main-content">
                {/* Mobile hamburger */}
                <button
                    className="hamburger-btn"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    ☰
                </button>
                <div className="page">{children}</div>
            </div>
        </div>
    );
}
