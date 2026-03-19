import { useNavigate } from 'react-router-dom';

export default function PlanCard({ plan }: { plan: any }) {
    const navigate = useNavigate();
    const isActive = plan.status === 'Active' || plan.status === 'active';
    const progress = plan.progress || 0;

    const handleAiTips = () => {
        const message = `Give me study tips and strategies for my learning plan: "${plan.title}" (Subject: ${plan.subject}). I have ${plan.timeframeDays || 7} days and study ${plan.hoursPerDay || plan.dailyHours || 1} hours per day. Current progress: ${progress}%. What should I focus on?`;
        navigate('/ai/tutor', { state: { prefill: message } });
    };

    return (
        <div className="card plan-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '16px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {plan.title}
                    </h3>
                    <span className="chip" style={{ fontSize: '11px', padding: '2px 10px' }}>
                        {plan.subject}
                    </span>
                </div>
                <div style={{
                    fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: '20px',
                    marginLeft: '12px', flexShrink: 0,
                    background: isActive ? 'rgba(0,229,196,0.15)' : 'rgba(255,179,71,0.15)',
                    color: isActive ? '#00E5C4' : '#FFB347'
                }}>
                    {plan.status || 'Active'}
                </div>
            </div>

            {/* Progress */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="progress-bg">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Meta */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '12px', color: 'var(--muted)',
                paddingTop: '12px', borderTop: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>📅</span>
                    <span>{plan.timeframeDays || 7} Days</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>⏱️</span>
                    <span>{plan.hoursPerDay || plan.dailyHours || 1} hrs/day</span>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="btn-ghost" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>Edit</button>
                <button
                    onClick={handleAiTips}
                    style={{
                        flex: 1, padding: '8px', fontSize: '12px',
                        borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                        background: 'rgba(0,229,196,0.1)', color: '#00E5C4',
                        border: '1px solid rgba(0,229,196,0.22)', fontWeight: 500,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,196,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,229,196,0.1)')}
                >
                    AI Tips 🪄
                </button>
            </div>
        </div>
    );
}
