import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import ResultCard from '../components/ui/ResultCard';
import LoadingDots from '../components/ui/LoadingDots';
import { generateQuiz } from '../services/ai';

export default function QuizGenerator() {
    const navigate = useNavigate();
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('Beginner');
    const [count, setCount] = useState('3');
    
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await generateQuiz(topic, difficulty, parseInt(count));
            let parsed = res.questions || res.result;
            if (typeof parsed === 'string') {
                const cleaned = parsed.replace(/```json/gi, '').replace(/```/g, '').trim();
                parsed = JSON.parse(cleaned);
            }
            if (Array.isArray(parsed) && parsed.length > 0) {
                setQuestions(parsed);
                setCurrentIdx(0);
                setSelectedOpt(null);
                setScore(0);
                setIsFinished(false);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (idx: number) => {
        if (selectedOpt !== null) return; // Prevent changing answer
        setSelectedOpt(idx);
        
        if (idx === questions[currentIdx].answer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelectedOpt(null);
        } else {
            setIsFinished(true);
        }
    };

    const reset = () => {
        setQuestions([]);
        setTopic('');
    };

    const renderQuiz = () => {
        const q = questions[currentIdx];
        const isAnswered = selectedOpt !== null;

        return (
            <div className="card max-w-[600px] w-full mx-auto p-8 relative">
                <div className="flex justify-between items-center mb-6">
                    <span className="chip active text-accent font-bold px-4 py-1">Question {currentIdx + 1} of {questions.length}</span>
                    <span className="text-muted text-sm">{difficulty} • {topic}</span>
                </div>
                
                <h3 className="section-title text-xl mb-8 leading-relaxed">{q.question}</h3>
                
                <div className="flex col gap-3 mb-6">
                    {q.options.map((opt: string, i: number) => {
                        let btnStyle = "btn-ghost justify-start py-4 border-2";
                        if (isAnswered) {
                            if (i === q.answer) {
                                btnStyle = "btn-teal justify-start py-4 font-bold border-2 border-[#00E5C4]";
                            } else if (i === selectedOpt && i !== q.answer) {
                                btnStyle = "btn-red justify-start py-4 font-bold border-2 border-[#FF6B6B]";
                            } else {
                                btnStyle = "btn-ghost justify-start py-4 border-2 opacity-50";
                            }
                        }

                        return (
                            <button key={i} className={btnStyle} onClick={() => handleOptionSelect(i)}>
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mr-3 ${isAnswered && (i === q.answer || (i === selectedOpt)) ? 'bg-white/20' : 'bg-[var(--surface3)]'}`}>
                                    {['A', 'B', 'C', 'D'][i]}
                                </span>
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div className="flex justify-end pt-4 border-t border-border mt-4">
                        <button className="btn-glow px-8 py-3" onClick={handleNext}>
                            {currentIdx < questions.length - 1 ? 'Next Question →' : 'Finish Quiz ✨'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderResult = () => {
        const percentage = Math.round((score / questions.length) * 100);
        let colorObj = { color: '#FF6B6B', title: 'Keep Practicing! 💪' }; // Red
        if (percentage >= 80) colorObj = { color: '#00E5C4', title: 'Excellent Work! 🏆' }; // Teal
        else if (percentage >= 50) colorObj = { color: '#FFB347', title: 'Good Effort! 👍' }; // Amber

        return (
            <div className="card max-w-[500px] w-full mx-auto p-10 text-center flex col items-center">
                <h2 className="section-title text-2xl mb-2">{colorObj.title}</h2>
                <div className="text-5xl font-syne font-black mb-2" style={{ color: colorObj.color }}>
                    {percentage}%
                </div>
                <div className="text-muted mb-8 text-lg font-medium">
                    You scored <strong className="text-white">{score}</strong> out of <strong className="text-white">{questions.length}</strong> correct.
                </div>
                
                <div className="flex gap-4 w-full justify-center mt-4">
                    <button className="btn-ghost flex-1 py-3" onClick={reset}>Try Another 🔄</button>
                    <button className="btn-glow flex-1 flex items-center justify-center py-3" onClick={() => navigate('/ai/tutor')}>Ask AI Tutor 🧑‍🏫</button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex col h-full">
            <PageHeader title="AI Quiz Generator" subtitle="Test your knowledge on any subject instantly." />

            {questions.length === 0 ? (
                <div className="card max-w-[500px] w-full mx-auto" style={{ borderTop: '4px solid #6C63FF' }}>
                    <div className="form-group mb-4">
                        <label>What do you want to be quizzed on?</label>
                        <input 
                            placeholder="e.g. JavaScript Closures, WWII History" 
                            autoFocus 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-4 mb-6">
                        <div className="form-group mb-0 flex-1">
                            <label>Difficulty</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </select>
                        </div>
                        <div className="form-group mb-0 flex-1">
                            <label>Questions</label>
                            <input type="number" min="3" max="10" value={count} onChange={(e) => setCount(e.target.value)} />
                        </div>
                    </div>

                    <button 
                        className="btn-glow w-full justify-center py-3 text-[14px]" 
                        disabled={!topic || loading}
                        onClick={handleGenerate}
                    >
                        {loading ? <LoadingDots /> : 'Generate Custom Quiz ✨'}
                    </button>
                    
                    {error && <div className="text-[#FF6B6B] bg-[#FF6B6B]/10 p-3 mt-4 rounded-lg text-sm text-center font-medium border border-[#FF6B6B]/20">{error}</div>}
                </div>
            ) : isFinished ? (
                renderResult()
            ) : (
                renderQuiz()
            )}
        </div>
    );
}
