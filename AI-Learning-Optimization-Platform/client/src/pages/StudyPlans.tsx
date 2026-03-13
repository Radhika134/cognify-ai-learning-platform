import { useEffect, useState } from 'react';
import { getStudyPlans, createStudyPlan, updateStudyPlan, deleteStudyPlan, generateAiPlan } from '../services/api';

const EMPTY_FORM = {
    title: '', subject: '', description: '',
    goals: '', dailyHours: 2,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', status: 'active'
};

export default function StudyPlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');

    // AI Modal State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiForm, setAiForm] = useState({ prompt: '', subject: '', timeframeDays: 30 });
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    const fetchPlans = async () => {
        try {
            const res = await getStudyPlans();
            setPlans(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleGenerateAiPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setAiGenerating(true);
        setAiError('');
        try {
            const res = await generateAiPlan(aiForm);
            const generated = res.data;

            const endDate = new Date();
            endDate.setDate(endDate.getDate() + aiForm.timeframeDays);

            setForm({
                title: generated.title || `${aiForm.subject} Plan`,
                subject: generated.subject || aiForm.subject,
                description: generated.description || '',
                goals: (generated.goals || []).join('\n'),
                dailyHours: generated.hoursPerDay || 2,
                startDate: new Date().toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                status: 'active'
            });

            setShowAiModal(false);
            setEditId(null);
            setShowModal(true);
        } catch (err: any) {
            setAiError(err.response?.data?.message || 'Failed to generate plan.');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...form, goals: form.goals.split('\n').filter(g => g.trim()), dailyHours: Number(form.dailyHours) };
            if (editId) {
                await updateStudyPlan(editId, payload);
            } else {
                await createStudyPlan(payload);
            }
            await fetchPlans();
            setShowModal(false);
            setForm(EMPTY_FORM);
            setEditId(null);
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (plan: any) => {
        setForm({
            title: plan.title, subject: plan.subject,
            description: plan.description || '',
            goals: (plan.goals || []).join('\n'),
            dailyHours: plan.dailyHours,
            startDate: plan.startDate?.split('T')[0] || '',
            endDate: plan.endDate?.split('T')[0] || '',
            status: plan.status
        });
        setEditId(plan._id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this study plan?')) return;
        await deleteStudyPlan(id);
        setPlans(prev => prev.filter(p => p._id !== id));
    };

    const filtered = filter === 'all' ? plans : plans.filter(p => p.status === filter);

    const badgeClass = (status: string) =>
        status === 'active' ? 'badge-active' : status === 'completed' ? 'badge-completed' : 'badge-paused';

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Study Plans</h2>
                    <p className="page-subtitle">Manage your personalized learning schedules.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }} onClick={() => { setAiForm({ prompt: '', subject: '', timeframeDays: 30 }); setShowAiModal(true); setAiError(''); }}>
                        🪄 AI Study Strategy
                    </button>
                    <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); }}>
                        ＋ New Plan
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {['all', 'active', 'completed', 'paused'].map(f => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(f)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="glass-card empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No {filter !== 'all' ? filter : ''} plans found</h3>
                    <p>Create a new study plan to start organizing your learning.</p>
                    <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
                        Create Study Plan
                    </button>
                </div>
            ) : (
                <div className="plans-grid">
                    {filtered.map(plan => (
                        <div key={plan._id} className="plan-card">
                            <div className="plan-header">
                                <div>
                                    <div className="plan-title">{plan.title}</div>
                                    <div className="plan-subject">📌 {plan.subject}</div>
                                </div>
                                <span className={`badge ${badgeClass(plan.status)}`}>{plan.status}</span>
                            </div>
                            {plan.description && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {plan.description}
                                </p>
                            )}
                            <div className="plan-meta">
                                <span className="meta-item">⏱️ {plan.dailyHours}h/day</span>
                                <span className="meta-item">📅 {new Date(plan.startDate).toLocaleDateString()}</span>
                                <span className="meta-item">🏁 {new Date(plan.endDate).toLocaleDateString()}</span>
                            </div>
                            {plan.goals?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>GOALS</div>
                                    {plan.goals.slice(0, 3).map((g: string, i: number) => (
                                        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 2 }}>✦ {g}</div>
                                    ))}
                                </div>
                            )}
                            <div className="plan-actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(plan)}>✏️ Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(plan._id)}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editId ? '✏️ Edit Study Plan' : '✨ New Study Plan'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input className="form-input" placeholder="e.g. Master Python" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input className="form-input" placeholder="e.g. Programming" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Goals (one per line)</label>
                                <textarea className="form-input" placeholder="Learn closures&#10;Master async/await" value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Hours/Day *</label>
                                    <input className="form-input" type="number" min={1} max={24} value={form.dailyHours} onChange={e => setForm({ ...form, dailyHours: Number(e.target.value) })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date *</label>
                                    <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date *</label>
                                    <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                                </div>
                            </div>
                            {editId && (
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="paused">Paused</option>
                                    </select>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <><span className="spinner"></span> Saving...</> : (editId ? 'Save Changes' : 'Create Plan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Generator Modal */}
            {showAiModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAiModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">🪄 AI Study Strategy Generator</h3>
                            <button className="modal-close" onClick={() => setShowAiModal(false)}>×</button>
                        </div>
                        <form className="modal-form" onSubmit={handleGenerateAiPlan}>
                            {aiError && <div className="error-msg" style={{ marginBottom: 12 }}>⚠️ {aiError}</div>}
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input className="form-input" placeholder="e.g. Data Structures" value={aiForm.subject} onChange={e => setAiForm({ ...aiForm, subject: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">What are your specific goals? *</label>
                                <textarea className="form-input" placeholder="e.g. I want to become an expert and prepare for top tier software engineering interviews..." value={aiForm.prompt} onChange={e => setAiForm({ ...aiForm, prompt: e.target.value })} required rows={4} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Timeframe (Days) *</label>
                                <input className="form-input" type="number" min={1} max={365} value={aiForm.timeframeDays} onChange={e => setAiForm({ ...aiForm, timeframeDays: Number(e.target.value) })} required />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAiModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={aiGenerating} style={{ background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)', border: 'none' }}>
                                    {aiGenerating ? <><span className="spinner"></span> AI Thinking...</> : '✨ Build Strategy'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
