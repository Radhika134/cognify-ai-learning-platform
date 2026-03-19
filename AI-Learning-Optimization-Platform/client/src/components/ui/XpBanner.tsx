import { useEffect, useState } from 'react';

interface XpBannerProps {
    xp: number;
    level: number;
    streak: number;
    maxLevelXp?: number;
}

export default function XpBanner({ xp, level, streak, maxLevelXp = 1000 }: XpBannerProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    const progressPercent = Math.min((xp / maxLevelXp) * 100, 100);

    return (
        <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15), rgba(0, 229, 196, 0.15))',
            borderColor: 'rgba(108, 99, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '30px'
        }}>
            <div className="flex items-center gap-4">
                <div style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6C63FF, #00E5C4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 'bold'
                }}>
                    L{level}
                </div>
                <div>
                    <h3 style={{ fontSize: '18px', fontFamily: 'Plus Jakarta Sans', fontWeight: 800 }}>{xp} XP</h3>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Keep going! Level {level + 1} is near.</div>
                </div>
            </div>
            
            <div className="flex-1" style={{ maxWidth: '400px', margin: '0 20px' }}>
                <div className="flex justify-between mb-1" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    <span>Current Progress</span>
                    <span>{xp} / {maxLevelXp}</span>
                </div>
                <div className="progress-bg">
                    <div 
                        className={`progress-fill ${animate ? 'animate' : ''}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div style={{
                background: 'rgba(255, 107, 107, 0.15)',
                color: '#FF6B6B',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                🔥 {streak} Day Streak
            </div>
        </div>
    );
}
