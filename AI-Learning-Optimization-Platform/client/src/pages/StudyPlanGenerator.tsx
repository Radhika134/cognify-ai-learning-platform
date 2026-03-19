import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import ResultCard from '../components/ui/ResultCard';
import LoadingDots from '../components/ui/LoadingDots';
import { generateStudyPlan } from '../services/ai';

export default function StudyPlanGenerator() {
    const navigate = useNavigate();
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('');
    const [days, setDays] = useState('7');
    const [time, setTime] = useState('1 hour');
    const [level, setLevel] = useState('Beginner');
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim() || !goal.trim() || !days) return;
        setLoading(true);
        setError('');
        try {
            const res = await generateStudyPlan(topic, goal, parseInt(days), time, level);
            setResult(res.result || res.plan);
        } catch (err: any) {
            setError(err.message || 'Failed to generate plan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader title="Study Plan Generator" subtitle="Get a customized, actionable roadmap in seconds" />

            <div className="grid-2" style={{ gridTemplateColumns: result ? '1fr' : '1fr' }}>
                {!result ? (
                    <div className="card max-w-[600px] w-full mx-auto" style={{ borderTop: '4px solid #6C63FF' }}>
                        <div className="form-group">
                            <label>Subject / Topic</label>
                            <input 
                                placeholder="e.g. Data Structures and Algorithms" 
                                value={topic} onChange={e => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Goal</label>
                            <textarea 
                                placeholder="What exactly do you want to achieve? e.g. Pass a coding interview" 
                                value={goal} onChange={e => setGoal(e.target.value)}
                            />
                        </div>

                        <div className="grid-3 mb-6">
                            <div className="form-group mb-0">
                                <label>Days</label>
                                <input type="number" min="1" max="90" value={days} onChange={e => setDays(e.target.value)} />
                            </div>
                            <div className="form-group mb-0">
                                <label>Daily time</label>
                                <select value={time} onChange={e => setTime(e.target.value)}>
                                    <option>30 mins</option>
                                    <option>1 hour</option>
                                    <option>2 hours</option>
                                    <option>3+ hours</option>
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label>Current level</label>
                                <select value={level} onChange={e => setLevel(e.target.value)}>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            className="btn-glow w-full justify-center py-3" 
                            disabled={!topic || !goal || loading}
                            onClick={handleGenerate}
                        >
                            {loading ? <LoadingDots /> : '✨ Build My Strategy'}
                        </button>

                        {error && <div className="text-[#FF6B6B] mt-4 text-center">{error}</div>}
                    </div>
                ) : (
                    <div className="max-w-[800px] mx-auto w-full">
                        <ResultCard tagLabel="AI Generated Plan" tagStyle="purple">
                            {result}
                        </ResultCard>

                        <div className="flex gap-4 mt-6">
                            <button className="btn-ghost flex-1 py-3" onClick={() => setResult('')}>Generate Another</button>
                            <button className="btn-glow flex-1 py-3 flex justify-center items-center" onClick={() => navigate('/ai/tutor')}>Ask Tutor Questions 💬</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
