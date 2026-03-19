import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/layout/PageHeader';
import LoadingDots from '../components/ui/LoadingDots';
import { summarizeNotes, detectTopic } from '../services/ai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Subject List ─────────────────────────────────────────────────────────────
const subjects = [
    { label: '🎨 Other',       value: 'other' },
    { label: '💻 Programming', value: 'programming' },
    { label: '📐 Math',        value: 'mathematics' },
    { label: '🔬 Science',     value: 'science' },
    { label: '📜 History',     value: 'history' },
    { label: '🌍 Geography',   value: 'geography' },
    { label: '📖 Literature',  value: 'literature' },
    { label: '💰 Economics',   value: 'economics' },
    { label: '🧬 Biology',     value: 'biology' },
    { label: '⚗️ Chemistry',   value: 'chemistry' },
    { label: '🏛️ Physics',     value: 'physics' },
];

// ─── Sample Notes (subject-aware) ────────────────────────────────────────────
const sampleNotes: Record<string, string> = {
    programming: `Python Functions - Lecture Notes

A function is a reusable block of code that performs a specific task.
Defined using the 'def' keyword followed by the function name.

Syntax:
def function_name(parameters):
    # code block
    return value

Types of functions:
1. Built-in functions - print(), len(), type()
2. User-defined functions - created by programmer
3. Lambda functions - anonymous, one-line functions

Parameters vs Arguments:
- Parameters are variables in function definition
- Arguments are actual values passed when calling

Default parameters: def greet(name="World")
*args - accepts variable number of positional arguments
**kwargs - accepts variable number of keyword arguments

Return statement:
- Returns value from function
- Function ends when return is reached
- Can return multiple values as tuple

Scope:
- Local scope: variables inside function
- Global scope: variables outside function
- Use 'global' keyword to modify global variable inside function`,

    mathematics: `Calculus - Derivatives Notes

Derivative measures rate of change of a function.
Notation: f'(x), dy/dx, df/dx

Basic Rules:
1. Power Rule: d/dx(x^n) = nx^(n-1)
2. Constant Rule: d/dx(c) = 0
3. Sum Rule: d/dx(f+g) = f' + g'
4. Product Rule: d/dx(fg) = f'g + fg'
5. Chain Rule: d/dx(f(g(x))) = f'(g(x)) * g'(x)

Common Derivatives:
- d/dx(sin x) = cos x
- d/dx(cos x) = -sin x
- d/dx(e^x) = e^x
- d/dx(ln x) = 1/x

Applications:
- Finding slope of tangent line
- Optimization problems (max/min)
- Rate of change problems
- Physics: velocity = derivative of position`,

    science: `Newton's Laws of Motion

First Law (Law of Inertia):
An object at rest stays at rest, an object in motion stays in motion
unless acted upon by an external force.

Second Law (F = ma):
Force equals mass times acceleration.
- F measured in Newtons (N)
- m measured in kilograms (kg)
- a measured in m/s²

Third Law (Action-Reaction):
For every action there is an equal and opposite reaction.
Example: Rocket propulsion, swimming, walking.

Key Concepts:
- Net force = sum of all forces
- Equilibrium = net force is zero
- Friction opposes motion`,

    history: `World War II - Key Events Timeline

1939 - Germany invades Poland, Britain and France declare war
1940 - Fall of France, Battle of Britain begins
1941 - Operation Barbarossa, Japan attacks Pearl Harbor, USA enters war
1942 - Battle of Stalingrad begins, Battle of Midway (Pacific turning point)
1943 - Allied invasion of Italy; German defeat at Stalingrad
1944 - D-Day (June 6), Allied liberation of Paris
1945 - Germany surrenders (May 8, V-E Day); Atomic bombs on Japan; Japan surrenders (Sept 2)

Key Figures: Churchill, Roosevelt, Hitler, Stalin, Hirohito

Causes: Treaty of Versailles, Great Depression, Rise of fascism, Appeasement`,

    other: `Meeting Notes - Product Strategy Session

Key Discussion Points:
1. Q2 Roadmap priorities
   - Launch mobile app by April
   - Improve onboarding flow
   - Add dark mode support

2. User Feedback Analysis
   - 78% satisfaction rate
   - Top complaint: slow loading
   - Most requested: offline mode

3. Technical Debt
   - Refactor auth module
   - DB query optimization
   - Update deprecated dependencies

Action Items:
- Design: wireframes by March 25
- Engineering: performance audit by March 28
- Product: user interview schedule by March 20`,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotesSummarizer() {
    const [notes, setNotes]               = useState('');
    const [format, setFormat]             = useState('both');
    const [subject, setSubject]           = useState('other');
    const [difficulty, setDifficulty]     = useState<'basic' | 'advanced'>('basic');
    const [loading, setLoading]           = useState(false);
    const [result, setResult]             = useState<any>(null);
    const [error, setError]               = useState('');
    const [copied, setCopied]             = useState(false);
    const [exporting, setExporting]       = useState(false);
    const [detectedTopic, setDetectedTopic] = useState<string | null>(null);
    const [isDetecting, setIsDetecting]   = useState(false);

    // ── Live counts ──
    const wordCount   = notes.trim() ? notes.trim().split(/\s+/).length : 0;
    const charCount   = notes.length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const isReady     = wordCount > 50;

    // ── Auto-detect topic (debounced 1.5 s) ──
    useEffect(() => {
        if (notes.length < 100) { setDetectedTopic(null); return; }
        const timer = setTimeout(async () => {
            setIsDetecting(true);
            try {
                const res = await detectTopic(notes);
                setDetectedTopic(res.topic || null);
            } catch { setDetectedTopic(null); }
            setIsDetecting(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [notes]);

    // ── Summarize ──
    const handleSummarize = async () => {
        if (!notes.trim()) return;
        setLoading(true); setError('');
        try {
            const res = await summarizeNotes(notes, format as any, subject, difficulty);
            let parsed = res.result;
            try {
                if (typeof parsed === 'string') {
                    const clean = parsed.replace(/```json/gi, '').replace(/```/g, '').trim();
                    if (clean.startsWith('{')) parsed = JSON.parse(clean);
                }
            } catch {}
            setResult(parsed);
        } catch (err: any) {
            setError(err.message || 'Failed to summarize. Please try again.');
        } finally { setLoading(false); }
    };

    // ── Copy output ──
    const copyOutput = useCallback(() => {
        const text = typeof result === 'string'
            ? result
            : [
                ...(result?.keyPoints?.map((k: string) => `• ${k}`) ?? []),
                ...(result?.flashcards?.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`) ?? [])
              ].join('\n\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [result]);

    // ── Export PDF ──
    const exportPDF = async () => {
        setExporting(true);
        try {
            const el = document.getElementById('summary-output');
            if (!el) return;
            const canvas = await html2canvas(el, { backgroundColor: '#0D1120', scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const w = pdf.internal.pageSize.getWidth();
            const h = (canvas.height * w) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, w, h);
            pdf.save(`cognify-notes-${Date.now()}.pdf`);
        } finally { setExporting(false); }
    };

    // ─── Input Panel ──────────────────────────────────────────────────────────
    const inputPanel = (
        <div className="card" style={{ maxWidth: '820px', margin: '0 auto', borderTop: '4px solid #6C63FF' }}>

            {/* Subject chips */}
            <div className="subject-chips">
                {subjects.map(s => (
                    <button
                        key={s.value}
                        className={`subject-chip ${subject === s.value ? 'active' : ''}`}
                        onClick={() => setSubject(s.value)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Difficulty toggle */}
            <div className="difficulty-toggle">
                <span className="toggle-label">Difficulty:</span>
                <div className="toggle-group">
                    <button className={`toggle-btn ${difficulty === 'basic' ? 'active' : ''}`} onClick={() => setDifficulty('basic')}>
                        🌱 Basic
                    </button>
                    <button className={`toggle-btn ${difficulty === 'advanced' ? 'active' : ''}`} onClick={() => setDifficulty('advanced')}>
                        🔥 Advanced
                    </button>
                </div>
            </div>

            {/* Textarea */}
            <div className="form-group" style={{ marginBottom: '4px' }}>
                <div className="textarea-header">
                    <label style={{ margin: 0 }}>Paste your raw notes here</label>
                    <button
                        className="sample-btn"
                        onClick={() => setNotes(sampleNotes[subject] ?? sampleNotes['other'])}
                    >
                        ✨ Try Sample Notes
                    </button>
                </div>
                <textarea
                    style={{ minHeight: '260px' }}
                    placeholder="Paste lecture notes, article text, meeting notes, textbook chapters..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
            </div>

            {/* Live stats */}
            <div className={`notes-stats ${isReady ? 'ready' : ''}`}>
                <span>📝 {wordCount} words</span>
                <span>🔤 {charCount.toLocaleString()} chars</span>
                <span>⏱️ ~{readingTime} min read</span>
            </div>

            {/* Auto-detected topic */}
            {isDetecting && (
                <div className="detected-topic">
                    <span>⏳</span>
                    <span>Detecting topic...</span>
                </div>
            )}
            {detectedTopic && !isDetecting && (
                <div className="detected-topic">
                    <span>🔍</span>
                    <span>Detected topic:</span>
                    <span className="topic-tag">{detectedTopic}</span>
                </div>
            )}

            {/* Format + summarize row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                    <label>Output format</label>
                    <select value={format} onChange={e => setFormat(e.target.value)}>
                        <option value="summary">Key Points Only</option>
                        <option value="flashcards">Flashcards Only</option>
                        <option value="both">Both (Key Points + Flashcards)</option>
                    </select>
                </div>
                <button
                    className="btn-glow"
                    style={{ height: '48px', minWidth: '190px', fontSize: '14px' }}
                    disabled={!notes.trim() || loading}
                    onClick={handleSummarize}
                >
                    {loading ? <LoadingDots /> : '✨ Magic Organize'}
                </button>
            </div>

            {error && (
                <div style={{ color: '#FF6B6B', fontSize: '13px', marginTop: '12px', padding: '10px 14px', background: 'rgba(255,107,107,0.08)', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.2)' }}>
                    ⚠️ {error}
                </div>
            )}
        </div>
    );

    // ─── Output Panel ─────────────────────────────────────────────────────────
    const outputPanel = result ? (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div id="summary-output" className="card result-card">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '17px', margin: 0 }}>
                        📄 Your Study Materials
                        {detectedTopic && <span className="topic-tag" style={{ marginLeft: '12px', fontSize: '11px' }}>{detectedTopic}</span>}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {difficulty === 'advanced' ? '🔥 Advanced' : '🌱 Basic'} · {subjects.find(s => s.value === subject)?.label ?? 'Other'}
                    </span>
                </div>

                {typeof result === 'string' ? (
                    <div style={{ whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: '13.5px' }}>{result}</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                        {/* Key Points */}
                        {(format === 'summary' || format === 'both') && result.keyPoints?.length > 0 && (
                            <div>
                                <h4 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#a29bff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '14px' }}>
                                    🔑 Key Points
                                </h4>
                                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {result.keyPoints.map((kp: string, i: number) => (
                                        <li key={i} style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--text)' }}>{kp}</li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Flashcards */}
                        {(format === 'flashcards' || format === 'both') && result.flashcards?.length > 0 && (
                            <div>
                                <h4 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#00E5C4', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '14px' }}>
                                    🃏 Flashcards <span style={{ fontWeight: 400, fontSize: '12px', color: 'var(--muted)' }}>(click to reveal answer)</span>
                                </h4>
                                <div className="grid-2">
                                    {result.flashcards.map((fc: any, i: number) => (
                                        <FlashCard key={i} question={fc.question || fc.front} answer={fc.answer || fc.back} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Export row */}
                <div className="export-row">
                    <span className="export-label">Export:</span>
                    <button className={`export-btn ${copied ? 'copied' : ''}`} onClick={copyOutput}>
                        {copied ? '✅ Copied!' : '📋 Copy Text'}
                    </button>
                    <button className="export-btn export-pdf" onClick={exportPDF} disabled={exporting}>
                        {exporting ? '⏳ Generating…' : '📄 Save as PDF'}
                    </button>
                </div>
            </div>

            {/* Back button */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button className="btn-ghost" style={{ padding: '10px 28px' }} onClick={() => { setResult(null); setError(''); }}>
                    ← Summarize New Notes
                </button>
            </div>
        </div>
    ) : null;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div>
            <PageHeader
                title="Notes Summarizer"
                subtitle="Turn messy notes into organized key points & flashcards — with export"
            />
            {result ? outputPanel : inputPanel}
        </div>
    );
}

// ─── FlashCard subcomponent ───────────────────────────────────────────────────
function FlashCard({ question, answer }: { question: string; answer: string }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className="flashcard" onClick={() => setFlipped(f => !f)}>
            {!flipped ? (
                <div style={{ fontSize: '13.5px', fontWeight: 500, lineHeight: 1.55 }}>{question}</div>
            ) : (
                <div style={{ fontSize: '13.5px', color: '#00E5C4', fontWeight: 700, lineHeight: 1.55 }}>{answer}</div>
            )}
            <div className="flashcard-hint">{flipped ? 'Click to see question' : 'Click to reveal answer'}</div>
        </div>
    );
}
