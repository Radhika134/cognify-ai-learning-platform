import { useState, useEffect } from 'react';
import PageHeader from '../components/layout/PageHeader';
import PlanCard from '../components/ui/PlanCard';
import { getStudyPlans } from '../services/api';

export default function StudyPlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        getStudyPlans()
            .then(res => setPlans(res.data))
            .catch(err => console.error("Error loading plans:", err));
    }, []);

    // DB stores status as lowercase ('active', 'completed', 'paused')
    const filteredPlans = plans.filter(p => {
        if (filter === 'All') return true;
        return p.status?.toLowerCase() === filter.toLowerCase();
    });

    return (
        <div>
            <PageHeader 
                title="Study Plans" 
                subtitle="Manage and track your personalized learning roadmaps."
                action={<a href="/ai/plan-generator" className="btn-glow">🪄 Generate Plan</a>}
            />

            {/* Filter chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                {['All', 'Active', 'Completed', 'Paused'].map(f => (
                    <button 
                        key={f}
                        className={`chip ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {filteredPlans.length === 0 ? (
                <div style={{
                    padding: '48px 24px',
                    border: '2px dashed var(--border2)',
                    textAlign: 'center',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ fontSize: '40px' }}>🎯</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }}>No Plans Found</div>
                    <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                        You don't have any {filter.toLowerCase()} plans right now.
                    </p>
                    <a href="/ai/plan-generator" className="btn-ghost" style={{ marginTop: '4px' }}>
                        Generate with AI
                    </a>
                </div>
            ) : (
                <div className="grid-3">
                    {filteredPlans.map(plan => (
                        <PlanCard key={plan._id} plan={plan} />
                    ))}
                </div>
            )}
        </div>
    );
}
