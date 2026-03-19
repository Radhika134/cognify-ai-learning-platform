import { useState, useEffect } from 'react';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';
import AiFeatureCard from '../components/ui/AiFeatureCard';
import XpBanner from '../components/ui/XpBanner';
import { getStudyStats, getStudyPlans } from '../services/api';

interface DashboardProps {
    userName: string;
}

export default function Dashboard({ userName }: DashboardProps) {
    const [stats, setStats] = useState({
        totalHours: 0,
        topicsCompleted: 0,
        averageFocus: 0,
        totalSessions: 0,
        xp: 0,
        level: 1,
        streak: 0,
        maxLevelXp: 1000
    });
    const [activePlanCount, setActivePlanCount] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const statsData = await getStudyStats();
                const plansData = await getStudyPlans();
                
                const s = statsData.data;
                const totalDuration = s.totalDuration ?? 0;
                const hours = (totalDuration / 60).toFixed(1);
                // DB stores status as lowercase 'active'
                const activePlans = plansData.data.filter((p: any) =>
                    p.status?.toLowerCase() === 'active'
                ).length;

                setStats({
                    totalHours: parseFloat(hours),
                    topicsCompleted: s.totalTopicsCompleted ?? s.totalSessions ?? 0,
                    averageFocus: s.averageFocus ?? 0,
                    totalSessions: s.totalSessions ?? 0,
                    xp: s.gamification?.xp ?? 0,
                    level: s.gamification?.level ?? 1,
                    streak: s.gamification?.streak ?? 0,
                    maxLevelXp: 1000
                });
                setActivePlanCount(activePlans);
            } catch (err) {
                console.error("Dashboard fetch err:", err);
            }
        };
        fetchDashboardData();
    }, []);

    const greetingObj = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div>
            <PageHeader 
                title={`${greetingObj}, ${userName.split(' ')[0]}! 👋`} 
                subtitle="Here's a breakdown of your learning progress."
            />

            <XpBanner xp={stats.xp} level={stats.level} streak={stats.streak} maxLevelXp={stats.maxLevelXp} />

            <div className="grid-4 mb-6">
                <StatCard title="Active Study Plans" value={activePlanCount} icon="📚" colorHint="c1" />
                <StatCard title="Hours Studied" value={stats.totalHours.toFixed(1)} icon="⏱️" colorHint="c2" />
                <StatCard title="Topics Covered" value={stats.topicsCompleted} icon="🎯" colorHint="c3" />
                <StatCard title="Focus Rating" value={`${Number(stats.averageFocus).toFixed(1)}/5`} icon="🧠" colorHint="c4" />
            </div>

            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
                <div className="card h-full flex col justify-between">
                    <div>
                        <h3 className="section-title mb-2">Continue Learning</h3>
                        <p className="label-muted mb-4">You have {activePlanCount} active plans holding your progress.</p>
                    </div>
                    {activePlanCount === 0 ? (
                        <div className="flex-1 flex col items-center justify-center p-6 border-dashed border-2" style={{ borderColor: 'var(--border)', borderRadius: '12px' }}>
                            <div className="text-4xl mb-4">✨</div>
                            <div className="mb-4 text-center">No active plans right now.</div>
                            <a href="/ai/plan-generator" className="btn-glow">Generate with AI</a>
                        </div>
                    ) : (
                        <div className="flex-1 flex col gap-3">
                            <a href="/study-plans" className="btn-ghost w-full">View Active Plans &rarr;</a>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="section-title mb-4">Quick AI Actions</h3>
                    <div className="grid-2 gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        <AiFeatureCard title="AI Tutor" description="Chat 24/7" icon="💬" path="/ai/tutor" />
                        <AiFeatureCard title="Generate Quiz" description="Test knowledge" icon="🎯" path="/ai/quiz" />
                        <AiFeatureCard title="Summarizer" description="Clean up notes" icon="📝" path="/ai/notes" />
                        <AiFeatureCard title="Plan Setup" description="Instant roadmap" icon="✨" path="/ai/plan-generator" />
                    </div>
                </div>
            </div>
        </div>
    );
}
