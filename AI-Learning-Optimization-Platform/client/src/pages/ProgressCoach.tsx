import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import ResultCard from '../components/ui/ResultCard';
import StatCard from '../components/ui/StatCard';
import LoadingDots from '../components/ui/LoadingDots';
import { getStudyStats, getCoachAdvice } from '../services/api';

export default function ProgressCoach() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [struggle, setStruggle] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        getStudyStats().then(res => {
            const d = res.data;
            const hours = parseFloat(((d.totalDuration ?? 0) / 60).toFixed(1));
            setStats({
                sessions: d.totalSessions ?? 0,
                hours,
                focus: d.averageFocus ?? 0
            });
        }).catch(() => {});
    }, []);

    const handleAdvise = async () => {
        if (!struggle.trim() || !stats) return;
        setLoading(true);
        setError('');
        try {
            const res = await getCoachAdvice(stats, struggle);
            setResult(res.data?.result || res.data?.advice || 'No advice returned.');
        } catch (err: any) {
            setError(err.message || 'Failed to get coaching advice.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader title="Progress Coach" subtitle="Data-driven feedback to optimize your learning routine" />

            {!result ? (
                <div className="card max-w-[700px] w-full mx-auto" style={{ borderTop: '4px solid #FFB347' }}>
                    <h3 className="section-title mb-4">Your Recent Performance</h3>
                    
                    {stats ? (
                        <div className="grid-3 mb-8">
                            <StatCard title="Total Sessions" value={stats.sessions} icon="📚" colorHint="c1" />
                            <StatCard title="Total Hours" value={stats.hours} icon="⏱️" colorHint="c2" />
                            <StatCard title="Avg Focus" value={`${stats.focus}/5`} icon="🧠" colorHint="c4" />
                        </div>
                    ) : (
                        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '32px' }}>Loading stats...</div>
                    )}

                    <div className="form-group mb-6">
                        <label className="text-[15px] font-bold text-white mb-2">What are you struggling with right now?</label>
                        <textarea 
                            placeholder="e.g. I can't seem to stay focused for more than 20 minutes, or I keep forgetting what I learned yesterday." 
                            value={struggle} 
                            onChange={e => setStruggle(e.target.value)}
                            style={{ minHeight: '120px' }}
                        />
                    </div>

                    <button 
                        className="btn-glow w-full justify-center py-3 bg-[#FFB347] hover:bg-[#FFB347]/90 text-black shadow-[0_0_24px_rgba(255,179,71,0.38)]" 
                        disabled={!struggle || !stats || loading}
                        onClick={handleAdvise}
                    >
                        {loading ? <LoadingDots /> : '🏆 Analyze & Advise'}
                    </button>
                    {error && <div className="text-[#FF6B6B] mt-4 text-center text-sm">{error}</div>}
                </div>
            ) : (
                <div className="max-w-[800px] mx-auto w-full">
                    <ResultCard tagLabel="Coaching Report" tagStyle="amber">
                        {result}
                    </ResultCard>

                    <div className="flex gap-4 mt-6">
                        <button className="btn-ghost flex-1 py-3 border-[#FFB347]/30 hover:border-[#FFB347]" onClick={() => setResult('')}>Get New Advice</button>
                        <button 
                            className="flex-1 py-3 btn-glow bg-[#FFB347] hover:bg-[#FFB347]/90 text-black font-bold flex justify-center items-center gap-2" 
                            onClick={() => navigate('/ai/plan-generator')}
                        >
                            Optimize My Plan ⚙️
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
