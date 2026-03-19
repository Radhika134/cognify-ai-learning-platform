import type { ReactNode } from 'react';

interface ResultCardProps {
    tagLabel: string;
    tagStyle: 'purple' | 'amber' | 'teal' | 'red';
    children: ReactNode;
}

export default function ResultCard({ tagLabel, tagStyle, children }: ResultCardProps) {
    return (
        <div className="card result-card">
            <div className={`result-tag tag-${tagStyle}`}>
                {tagLabel}
            </div>
            <div className="result-content" style={{ whiteSpace: 'pre-line' }}>
                {children}
            </div>
        </div>
    );
}
