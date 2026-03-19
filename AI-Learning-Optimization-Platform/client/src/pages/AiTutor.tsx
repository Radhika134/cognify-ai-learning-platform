import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PageHeader from '../components/layout/PageHeader';
import { chatWithTutor, type ChatMessage } from '../services/ai';
import {
    createSession, updateSession, deleteSession as deleteStoredSession,
    getSessions, getSession, getLastSessionId,
    type ChatSession, type StoredMessage
} from '../services/chatStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    copied?: boolean;
}

// ─── Quick Prompts ─────────────────────────────────────────────────────────────

const quickPrompts = [
    { label: "Explain like I'm 10 🧒", prompt: "Explain this concept like I'm a complete beginner. Use a simple analogy." },
    { label: "Show me an example 💻", prompt: "Give me a practical code example I can run right now." },
    { label: "Quiz me ⚡", prompt: "Ask me 3 quick questions to test if I understood this topic." },
    { label: "Why does this matter? 🎯", prompt: "Why is this concept important? When will I actually use this in the real world?" },
    { label: "I'm stuck 😅", prompt: "I'm confused and stuck. Can you break this down into the simplest possible steps?" },
    { label: "What's next? 🗺️", prompt: "I think I understand this. What should I learn next to advance my skills?" },
];

// ─── Welcome message ───────────────────────────────────────────────────────────

const WELCOME: Message = {
    role: 'assistant',
    content: "Hi there! 👋 I'm your **Cognify AI Tutor** — your personal learning companion.\n\nAsk me anything — concepts, code, debugging, or even just need some motivation. I'm here for it all! 🚀\n\nWhat would you like to explore today?",
    timestamp: new Date()
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const toStoredMessages = (msgs: Message[]): StoredMessage[] =>
    msgs.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp.getTime() }));

const fromStoredMessages = (msgs: StoredMessage[]): Message[] =>
    msgs.map(m => ({ role: m.role, content: m.content, timestamp: new Date(m.timestamp) }));

const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatSessionDate = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AiTutor() {
    const location = useLocation();

    // Initialise or restore the last session
    const initSession = (): { session: ChatSession; messages: Message[] } => {
        const lastId = getLastSessionId();
        if (lastId) {
            const stored = getSession(lastId);
            if (stored && stored.messages.length > 0) {
                return { session: stored, messages: fromStoredMessages(stored.messages) };
            }
        }
        const fresh = createSession();
        return { session: fresh, messages: [WELCOME] };
    };

    const initial = initSession();
    const [currentSession, setCurrentSession] = useState<ChatSession>(initial.session);
    const [sessions, setSessions] = useState<ChatSession[]>(getSessions);
    const [messages, setMessages] = useState<Message[]>(initial.messages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [triggered, setTriggered] = useState(false);
    
    // Collapsible sidebar state (hidden by default)
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Keyboard shortcut for sidebar
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            // Ctrl/Cmd + B toggles sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                setSidebarOpen(prev => !prev);
            }
            // Escape closes sidebar
            if (e.key === 'Escape' && sidebarOpen) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [sidebarOpen]);

    // ── Persist messages to localStorage whenever they change ──
    useEffect(() => {
        if (messages.length <= 1 && messages[0]?.role === 'assistant') return; // don't save welcome-only
        updateSession(currentSession.id, toStoredMessages(messages));
        setSessions(getSessions());
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // ── Auto-send prefill from "AI Tips" button on plan cards ──
    useEffect(() => {
        const prefill = (location.state as any)?.prefill;
        if (prefill && !triggered) {
            setTriggered(true);
            handleSend(prefill);
        }
    }, [location.state]);

    // ── Start a new chat session ──
    const handleNewChat = () => {
        const fresh = createSession();
        setCurrentSession(fresh);
        setMessages([WELCOME]);
        setInput('');
        setSessions(getSessions());
    };

    // ── Switch to a saved session ──
    const handleLoadSession = (session: ChatSession) => {
        if (session.id === currentSession.id) return;
        setCurrentSession(session);
        setMessages(
            session.messages.length > 0
                ? fromStoredMessages(session.messages)
                : [WELCOME]
        );
        setInput('');
    };

    // ── Delete a saved session ──
    const handleDeleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteStoredSession(id);
        const refreshed = getSessions();
        setSessions(refreshed);
        // If we deleted the active session, start fresh
        if (id === currentSession.id) {
            handleNewChat();
        }
    };

    // ── Send a message ──
    const handleSend = useCallback(async (messageText: string = input) => {
        const text = messageText.trim();
        if (!text || loading) return;

        const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const history: ChatMessage[] = updatedMessages.map(m => ({
                role: m.role, content: m.content
            }));
            const res = await chatWithTutor(history);
            const aiContent = res.result || res.reply || 'Sorry, I had trouble responding. Please try again!';
            setMessages(prev => [...prev, { role: 'assistant', content: aiContent, timestamp: new Date() }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "⚡ Connection hiccup! Please check your internet/VPN and try again. I'll be right here! 😊",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            handleSend(); 
        }
    };

    const handleCopy = async (content: string, index: number) => {
        await navigator.clipboard.writeText(content);
        setMessages(prev => prev.map((m, i) => i === index ? { ...m, copied: true } : m));
        setTimeout(() => setMessages(prev => prev.map((m, i) => i === index ? { ...m, copied: false } : m)), 2000);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', gap: '14px' }}>
            <PageHeader title="AI Tutor" subtitle="Your personal 24/7 learning companion — conversations saved automatically" />

            {/* Quick Chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px', flexShrink: 0 }}>
                {quickPrompts.map((p, idx) => (
                    <button key={idx} className="chip" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => handleSend(p.prompt)} disabled={loading}>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Main layout: sidebar + toggle + centered chat */}
            <div className="tutor-layout">
                
                {/* ── Toggle Button ── */}
                <button 
                    className={`sidebar-toggle ${sidebarOpen ? 'open' : ''}`}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    title="Toggle history (Ctrl+B)"
                >
                    {sidebarOpen ? '←' : '🕐'}
                </button>

                {/* ── Sidebar Backdrop (Mobile feel) ── */}
                {sidebarOpen && (
                    <div 
                        className="sidebar-backdrop"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ── Chat History Sidebar ── */}
                <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="cs-header">
                        <span className="cs-title">💬 Chats</span>
                        <button className="cs-new" onClick={handleNewChat} title="Start new chat">+ New</button>
                    </div>

                    <div className="cs-list">
                        {sessions.length === 0 && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '8px 4px', textAlign: 'center' }}>
                                No saved chats yet.
                            </div>
                        )}

                        {sessions.map(session => (
                            <div
                                key={session.id}
                                className={`cs-item ${session.id === currentSession.id ? 'active' : ''}`}
                                onClick={() => setActiveChatSession(session)}
                            >
                                <div className="cs-item-icon">💬</div>
                                <div className="cs-item-content">
                                    <div className="cs-item-title">{session.title || 'New conversation'}</div>
                                    <div className="cs-item-meta">
                                        {session.messages.length > 0 ? `${session.messages.length} messages` : 'Empty'} · {formatSessionDate(session.updatedAt)}
                                    </div>
                                </div>
                                <button
                                    className="cs-item-del"
                                    onClick={e => handleDeleteSession(e, session.id)}
                                    title="Delete chat"
                                >✕</button>
                            </div>
                        ))}
                    </div>

                    <div className="cs-footer">
                        {sessions.length}/5 chats · 50 msg limit each
                    </div>
                </div>

                {/* ── Chat Main Area ── */}
                <div className={`chat-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                    <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        
                        {/* Messages Area */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <div className="chat-messages-wrap">
                                {messages.map((msg, i) => (
                                    <div key={i} className="chat-entry msg-row" style={{
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '3px'
                                    }}>
                                        <div style={{
                                            display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '82%',
                                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                                background: msg.role === 'assistant'
                                                    ? 'linear-gradient(135deg,#6C63FF,#00E5C4)'
                                                    : 'linear-gradient(135deg,#FF6B6B,#FFB347)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                                            }}>
                                                {msg.role === 'assistant' ? '✨' : '👤'}
                                            </div>

                                            {/* Bubble */}
                                            <div className={msg.role === 'assistant' ? 'bubble-ai' : ''} style={{
                                                padding: '14px 18px', borderRadius: '14px',
                                                background: msg.role === 'user' ? 'rgba(108,99,255,0.18)' : 'var(--surface2)',
                                                border: `1px solid ${msg.role === 'user' ? 'rgba(108,99,255,0.3)' : 'var(--border)'}`,
                                                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '14px',
                                                borderTopRightRadius: msg.role === 'user' ? '4px' : '14px',
                                                fontSize: '13.5px', lineHeight: '1.65',
                                                whiteSpace: msg.role === 'user' ? 'pre-wrap' : undefined
                                            }}>
                                                {msg.role === 'assistant' ? (
                                                    <ReactMarkdown components={{
                                                        code(props) {
                                                            const { className, children } = props;
                                                            const match = /language-(\w+)/.exec(className || '');
                                                            const isInline = !match && !String(children).includes('\n');
                                                            return !isInline && match ? (
                                                                <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                                                                    customStyle={{ borderRadius: '8px', fontSize: '12.5px', margin: '10px 0', background: '#0D1120', border: '1px solid var(--border)' }}>
                                                                    {String(children).replace(/\n$/, '')}
                                                                </SyntaxHighlighter>
                                                            ) : <code className={className} style={{ background: 'rgba(108,99,255,0.15)', padding: '2px 7px', borderRadius: '4px', fontSize: '12px', color: '#a29bff' }}>{children}</code>;
                                                        },
                                                        p: ({ children }) => <p style={{ margin: '6px 0', lineHeight: '1.65' }}>{children}</p>,
                                                        strong: ({ children }) => <strong style={{ color: '#EEF2FF', fontWeight: 600 }}>{children}</strong>,
                                                        ul: ({ children }) => <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>{children}</ul>,
                                                        ol: ({ children }) => <ol style={{ paddingLeft: '18px', margin: '8px 0' }}>{children}</ol>,
                                                        li: ({ children }) => <li style={{ margin: '4px 0', fontSize: '13px' }}>{children}</li>,
                                                    }}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                ) : msg.content}
                                            </div>

                                            {/* Copy button */}
                                            {msg.role === 'assistant' && (
                                                <button className="copy-btn" style={{ position: 'static', marginTop: '2px', alignSelf: 'flex-start', flexShrink: 0 }}
                                                    onClick={() => handleCopy(msg.content, i)}>
                                                    {msg.copied ? '✓ Copied' : 'Copy'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Timestamp */}
                                        <div className="msg-time" style={{
                                            paddingLeft: msg.role === 'assistant' ? '42px' : 0,
                                            paddingRight: msg.role === 'user' ? '42px' : 0
                                        }}>
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {loading && (
                                    <div className="chat-entry" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                            background: 'linear-gradient(135deg,#6C63FF,#00E5C4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                                        }}>✨</div>
                                        <div style={{
                                            background: 'var(--surface2)', border: '1px solid var(--border)',
                                            padding: '14px 18px', borderRadius: '14px', borderTopLeftRadius: '4px',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <span className="typing-dot"></span>
                                            <span className="typing-dot"></span>
                                            <span className="typing-dot"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input bar */}
                        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                            <div className="chat-input-wrap" style={{ paddingTop: '20px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                    <textarea
                                        ref={inputRef}
                                        placeholder="Ask anything… (Enter to send · Shift+Enter for new line)"
                                        value={input}
                                        onChange={e => {
                                            setInput(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                        }}
                                        onKeyDown={handleKeyDown}
                                        disabled={loading}
                                        rows={1}
                                        style={{ flex: 1, resize: 'none', minHeight: '46px', maxHeight: '120px', padding: '12px 16px', fontSize: '13.5px', lineHeight: '1.5' }}
                                    />
                                    <button className="btn-glow" onClick={() => handleSend()} disabled={loading || !input.trim()}
                                        style={{ height: '46px', padding: '0 20px', flexShrink: 0 }}>
                                        {loading ? '…' : 'Send ↗'}
                                    </button>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginTop: '8px', opacity: 0.55, textAlign: 'center' }}>
                                    Chats auto-saved · Powered by Claude ✦
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );

    // Wrapper for setting active chat session correctly
    function setActiveChatSession(session: ChatSession) {
        handleLoadSession(session);
        // Optionally close sidebar on mobile-sized screens when selecting a chat
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }
}
