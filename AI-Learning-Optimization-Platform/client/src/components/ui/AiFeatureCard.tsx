import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AiFeatureCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    path: string;
}

export default function AiFeatureCard({ title, description, icon, path }: AiFeatureCardProps) {
    return (
        <Link to={path} className="card ai-card">
            <div className="ai-card-icon">{icon}</div>
            <h3 className="ai-card-title">{title}</h3>
            <p className="ai-card-desc">{description}</p>
            <div className="ai-card-arrow">↗</div>
        </Link>
    );
}
