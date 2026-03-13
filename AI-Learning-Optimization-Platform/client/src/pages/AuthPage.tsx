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
                onLoginSuccess(res.data.token, email.split('@')[0]);
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
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>🧠 Cognify</h1>
                    <p>{isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="error-msg">⚠️ {error}</div>}

                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Jane Doe"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="jane.doe@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder={isLogin ? 'Enter your password' : 'Minimum 6 characters'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px' }}>
                        {loading ? <><span className="spinner"></span> {isLogin ? 'Signing in...' : 'Creating account...'}</> : (isLogin ? '🚀 Sign In' : '✨ Create Account')}
                    </button>
                </form>

                <div className="auth-switch">
                    {isLogin ? (
                        <>Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setIsLogin(false); setError(''); }}>Sign up</a></>
                    ) : (
                        <>Already have an account? <a href="#" onClick={e => { e.preventDefault(); setIsLogin(true); setError(''); }}>Sign in</a></>
                    )}
                </div>
            </div>
        </div>
    );
}
