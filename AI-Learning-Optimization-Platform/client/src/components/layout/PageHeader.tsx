import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="page-header">
            <div>
                <h2 className="page-title">{title}</h2>
                <p className="page-subtitle">{subtitle}</p>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
