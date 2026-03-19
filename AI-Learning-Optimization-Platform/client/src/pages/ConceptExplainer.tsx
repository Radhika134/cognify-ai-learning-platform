import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import ResultCard from '../components/ui/ResultCard';
import LoadingDots from '../components/ui/LoadingDots';
import { explainConcept } from '../services/ai';

export default function ConceptExplainer() {
    const navigate = useNavigate();
    const [concept, setConcept] = useState('');
    const [level, setLevel] = useState('5-year-old');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const chips = ['Python decorators', 'Recursion', 'Big O notation', 'REST APIs', 'Git branching', 'SQL joins'];

    const handleExplain = async (c = concept) => {
        if (!c.trim()) return;
        setConcept(c);
        setLoading(true);
        setError('');
        try {
            const res = await explainConcept(c, level);
            setResult(res.result || res.explanation);
        } catch (err: any) {
            setError(err.message || 'Failed to generate explanation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader title="Concept Explainer" subtitle="Simplify complex topics with analogies and examples" />

            {!result ? (
                <div className="card max-w-[600px] w-full mx-auto" style={{ borderTop: '4px solid #FFB347' }}>
                    <div className="mb-6">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Popular concepts</label>
                        <div className="flex flex-wrap gap-2">
                            {chips.map(c => (
                                <button key={c} className="chip" onClick={() => handleExplain(c)}>{c}</button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group mb-6">
                        <label>Concept to explain</label>
                        <input 
                            placeholder="e.g. Asynchronous programming, Quantum computing" 
                            value={concept} 
                            onChange={e => setConcept(e.target.value)}
                        />
                    </div>

                    <div className="form-group mb-8">
                        <label>Explain like I'm a...</label>
                        <select value={level} onChange={e => setLevel(e.target.value)}>
                            <option value="5-year-old">5-year-old (Simplest analogies)</option>
                            <option value="High schooler">High schooler (Basic overview)</option>
                            <option value="College student">College student (Academic & detailed)</option>
                            <option value="Senior developer">Senior developer (Technical & deep dive)</option>
                        </select>
                    </div>

                    <button 
                        className="btn-glow w-full justify-center py-3 bg-[#FFB347] hover:bg-[#FFB347]/90 hover:shadow-[0_0_24px_rgba(255,179,71,0.38)]" 
                        disabled={!concept || loading}
                        onClick={() => handleExplain(concept)}
                    >
                        {loading ? <LoadingDots /> : '💡 Decode Concept'}
                    </button>
                    {error && <div className="text-[#FF6B6B] mt-4 text-center text-sm">{error}</div>}
                </div>
            ) : (
                <div className="max-w-[700px] mx-auto w-full">
                    <ResultCard tagLabel="AI Explanation" tagStyle="amber">
                        {result}
                    </ResultCard>

                    <div className="flex gap-4 mt-6">
                        <button className="btn-ghost flex-1 py-3 border-[#FFB347]/30 hover:border-[#FFB347]" onClick={() => setResult('')}>Explain Another</button>
                        <button 
                            className="flex-1 py-3 btn-glow bg-[#FFB347] hover:bg-[#FFB347]/90 text-black font-bold flex justify-center items-center gap-2" 
                            onClick={() => navigate('/ai/quiz', { state: { topic: concept } })}
                        >
                            Quiz Me on This 🎯
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
