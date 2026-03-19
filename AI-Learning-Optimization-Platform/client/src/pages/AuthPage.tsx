import { useState } from 'react';
import { signup, login } from '../services/api';

interface Props {
    onLoginSuccess: (token: string, name: string) => void;
}

export default function AuthPage({ onLoginSuccess }: Props) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const res = await login({ email, password });
                onLoginSuccess(res.data.token, res.data.name || email.split('@')[0]);
            } else {
                await signup({ name, email, password });
                const res = await login({ email, password });
                onLoginSuccess(res.data.token, name);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>

            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '48px 44px',
                width: '100%',
                maxWidth: '440px',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>💎</div>
                    <h1 style={{ fontSize: '28px', fontFamily: 'Plus Jakarta Sans', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: '8px' }}>Cognify</h1>
                    <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(255,107,107,0.1)',
                        border: '1px solid rgba(255,107,107,0.3)',
                        color: '#FF6B6B',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="Jane Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="jane.doe@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '28px' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder={isLogin ? 'Enter your password' : 'Minimum 6 characters'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        className="btn-glow"
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: '15px', justifyContent: 'center' }}
                    >
                        {loading ? '...' : (isLogin ? '🚀 Sign In' : '✨ Create Account')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--muted)' }}>
                    {isLogin ? (
                        <>Don't have an account? <a href="#" style={{ color: 'var(--accent)' }} onClick={e => { e.preventDefault(); setIsLogin(false); setError(''); }}>Sign up</a></>
                    ) : (
                        <>Already have an account? <a href="#" style={{ color: 'var(--accent)' }} onClick={e => { e.preventDefault(); setIsLogin(true); setError(''); }}>Sign in</a></>
                    )}
                </div>
            </div>
        </div>
    );
}
