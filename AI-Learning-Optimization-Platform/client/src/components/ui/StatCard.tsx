import type { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    colorHint: 'c1' | 'c2' | 'c3' | 'c4'; // purple, teal, red, amber
}

export default function StatCard({ title, value, icon, colorHint }: StatCardProps) {
    return (
        <div className={`card stat-card ${colorHint}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value mt-1">{value}</div>
            <div className="stat-label mt-1">{title}</div>
        </div>
    );
}
