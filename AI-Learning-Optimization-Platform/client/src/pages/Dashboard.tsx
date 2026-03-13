import { useEffect, useState } from 'react';
import { getStudyPlans, getSummary } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard({ userName }: { userName: string }) {
    const [plans, setPlans] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, summaryRes] = await Promise.all([getStudyPlans(), getSummary()]);
                setPlans(plansRes.data);
                setSummary(summaryRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const activePlans = plans.filter((p: any) => p.status === 'active');


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 className="page-title">{getGreeting()}, {userName}! 👋</h2>
                    <p className="page-subtitle">Here's an overview of your learning progress.</p>
                </div>
                <Link to="/study-plans" className="btn btn-primary">
                    ＋ New Study Plan
                </Link>
            </div>

            {/* Gamification Banner */}
            <div className="glass-card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(79, 70, 229, 0.15))', border: '1px solid var(--accent-light)' }}>
                <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>🔥</div>
                        <div style={{ fontWeight: 600, marginTop: 8 }}>{summary?.streak || 0} Day Streak</div>
                    </div>
                    <div style={{ width: 1, height: 60, background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>✨</div>
                        <div style={{ fontWeight: 600, marginTop: 8 }}>{summary?.xp || 0} XP</div>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Badges Earned</div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', maxWidth: 300 }}>
                        {summary?.badges?.length > 0 ? summary.badges.map((b: string, i: number) => (
                            <span key={i} className="badge" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>{b}</span>
                        )) : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No badges yet</span>}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-value">{plans.length}</div>
                    <div className="stat-label">Total Study Plans</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-value">{activePlans.length}</div>
                    <div className="stat-label">Active Plans</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{summary?.totalHoursStudied ?? 0}h</div>
                    <div className="stat-label">Hours Studied</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{summary?.averageQuizScore ?? '—'}%</div>
                    <div className="stat-label">Avg Quiz Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{summary?.totalTopicsCompleted ?? 0}</div>
                    <div className="stat-label">Topics Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-value">{summary?.averageFocusRating ?? '—'}/5</div>
                    <div className="stat-label">Avg Focus Rating</div>
                </div>
            </div>

            {/* Active Plans Preview */}
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="section-title" style={{ margin: 0 }}>Active Study Plans</h3>
                <Link to="/study-plans" style={{ fontSize: '0.85rem', color: 'var(--accent-light)', textDecoration: 'none' }}>
                    View all →
                </Link>
            </div>

            {activePlans.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">📖</div>
                    <h3>No active plans yet</h3>
                    <p>Create your first study plan to get started on your learning journey.</p>
                    <Link to="/study-plans" className="btn btn-primary">Create Study Plan</Link>
                </div>
            ) : (
                <div className="plans-grid">
                    {activePlans.slice(0, 3).map(plan => (
                        <div key={plan._id} className="plan-card">
                            <div className="plan-header">
                                <div>
                                    <div className="plan-title">{plan.title}</div>
                                    <div className="plan-subject">📌 {plan.subject}</div>
                                </div>
                                <span className="badge badge-active">Active</span>
                            </div>
                            <div className="plan-meta">
                                <span className="meta-item">⏱️ {plan.dailyHours}h/day</span>
                                <span className="meta-item">📅 {new Date(plan.endDate).toLocaleDateString()}</span>
                            </div>
                            {plan.goals?.length > 0 && (
                                <div>
                                    {plan.goals.slice(0, 2).map((g: string, i: number) => (
                                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 3 }}>• {g}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
