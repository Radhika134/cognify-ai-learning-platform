import { useEffect, useState } from 'react';
import { getAllSessions, getSummary, getStudyPlans, logSession, deleteSession } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
    const [summary, setSummary] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        studyPlan: '', hoursStudied: 1, topicsCompleted: '',
        quizScore: '', focusRating: '', notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        try {
            const [sumRes, sessRes, plansRes] = await Promise.all([getSummary(), getAllSessions(), getStudyPlans()]);
            setSummary(sumRes.data);
            setSessions(sessRes.data);
            setPlans(plansRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await logSession({
                studyPlan: form.studyPlan,
                date: form.date,
                hoursStudied: Number(form.hoursStudied),
                topicsCompleted: form.topicsCompleted.split('\n').filter(t => t.trim()),
                quizScore: form.quizScore ? Number(form.quizScore) : undefined,
                focusRating: form.focusRating ? Number(form.focusRating) : undefined,
                notes: form.notes
            });
            await fetchData();
            setShowModal(false);
            setForm({ studyPlan: '', hoursStudied: 1, topicsCompleted: '', quizScore: '', focusRating: '', notes: '', date: new Date().toISOString().split('T')[0] });
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this session?')) return;
        await deleteSession(id);
        setSessions(prev => prev.filter(s => s._id !== id));
    };

    const focusLabel = (r: number) => ['', '😔 Poor', '😐 Fair', '🙂 Good', '😊 Great', '🔥 Excellent'][r] || r;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Learning Analytics</h2>
                    <p className="page-subtitle">Track your progress and study sessions.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} disabled={plans.length === 0}>
                    ＋ Log Session
                </button>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{summary?.totalSessions ?? 0}</div>
                    <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{summary?.totalHoursStudied ?? 0}h</div>
                    <div className="stat-label">Hours Studied</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📖</div>
                    <div className="stat-value">{summary?.totalTopicsCompleted ?? 0}</div>
                    <div className="stat-label">Topics Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{summary?.averageQuizScore ?? '—'}%</div>
                    <div className="stat-label">Avg Quiz Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{summary?.averageFocusRating ?? '—'}/5</div>
                    <div className="stat-label">Avg Focus Rating</div>
                </div>
            </div>

            {/* Score Progress Bars */}
            {summary && (summary.averageQuizScore || summary.averageFocusRating) && (
                <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 className="section-title">Performance Snapshot</h3>
                    {summary.averageQuizScore && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>Quiz Performance</span><span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{summary.averageQuizScore}%</span>
                            </div>
                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${summary.averageQuizScore}%` }} /></div>
                        </div>
                    )}
                    {summary.averageFocusRating && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>Focus Rating</span><span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{summary.averageFocusRating}/5</span>
                            </div>
                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(summary.averageFocusRating / 5) * 100}%` }} /></div>
                        </div>
                    )}
                </div>
            )}

            {/* Deep Learning Analytics Chart */}
            {sessions.length > 0 && (
                <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 className="section-title">Productivity Trends (Hours & Focus)</h3>
                    <div style={{ height: 300, width: '100%', marginTop: 20 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...sessions].reverse()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                />
                                <YAxis yAxisId="left" stroke="var(--accent-light)" fontSize={12} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} domain={[0, 5]} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                                    formatter={(value: any, name: any) => [value, name === 'hoursStudied' ? 'Hours Studied' : 'Focus Rating']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Line yAxisId="left" type="monotone" dataKey="hoursStudied" stroke="var(--accent-light)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="focusRating" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Sessions List */}
            <h3 className="section-title">Study Sessions</h3>
            {sessions.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No sessions logged yet</h3>
                    <p>Log your first study session to start tracking your progress.</p>
                    {plans.length > 0 ? (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Log Session</button>
                    ) : (
                        <p style={{ color: 'var(--warning)', fontSize: '0.82rem' }}>⚠️ Create a study plan first before logging sessions.</p>
                    )}
                </div>
            ) : (
                <div className="session-list">
                    {sessions.map(s => (
                        <div key={s._id} className="session-item">
                            <div className="session-info">
                                <h4>{s.studyPlan?.title ?? 'Study Session'}</h4>
                                <p>{new Date(s.date).toLocaleDateString()} · {s.topicsCompleted?.join(', ') || 'No topics listed'}</p>
                                {s.notes && <p style={{ marginTop: 2, fontStyle: 'italic' }}>{s.notes}</p>}
                            </div>
                            <div className="session-stats">
                                <div className="session-stat">
                                    <div className="session-stat-value">{s.hoursStudied}h</div>
                                    <div className="session-stat-label">Studied</div>
                                </div>
                                {s.quizScore != null && (
                                    <div className="session-stat">
                                        <div className="session-stat-value">{s.quizScore}%</div>
                                        <div className="session-stat-label">Quiz</div>
                                    </div>
                                )}
                                {s.focusRating != null && (
                                    <div className="session-stat">
                                        <div className="session-stat-value" style={{ fontSize: '0.85rem' }}>{focusLabel(s.focusRating)}</div>
                                        <div className="session-stat-label">Focus</div>
                                    </div>
                                )}
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Log Session Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">📝 Log Study Session</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form className="modal-form" onSubmit={handleLog}>
                            <div className="form-group">
                                <label className="form-label">Study Plan *</label>
                                <select className="form-input" value={form.studyPlan} onChange={e => setForm({ ...form, studyPlan: e.target.value })} required>
                                    <option value="">Select a plan...</option>
                                    {plans.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hours Studied *</label>
                                    <input className="form-input" type="number" min={0.5} max={24} step={0.5} value={form.hoursStudied} onChange={e => setForm({ ...form, hoursStudied: Number(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Topics Completed (one per line)</label>
                                <textarea className="form-input" placeholder="Linear Regression&#10;Gradient Descent" value={form.topicsCompleted} onChange={e => setForm({ ...form, topicsCompleted: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Quiz Score (%)</label>
                                    <input className="form-input" type="number" min={0} max={100} placeholder="0–100" value={form.quizScore} onChange={e => setForm({ ...form, quizScore: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Focus Rating (1–5)</label>
                                    <input className="form-input" type="number" min={1} max={5} placeholder="1–5" value={form.focusRating} onChange={e => setForm({ ...form, focusRating: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea className="form-input" placeholder="How did the session go?" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <><span className="spinner"></span> Logging...</> : '✅ Log Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
