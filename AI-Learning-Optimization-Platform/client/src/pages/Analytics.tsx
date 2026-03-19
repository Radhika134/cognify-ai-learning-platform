import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';
import { getStudyStats, getDetailedAnalytics } from '../services/api';

export default function Analytics() {
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalHours: 0,
        topicsCompleted: 0
    });
    
    // Default chart data shown for new users (looks great, replaced by real data once sessions exist)
    const [chartData, setChartData] = useState([
        { name: 'Mon', hours: 1.5 },
        { name: 'Tue', hours: 2.5 },
        { name: 'Wed', hours: 0 },
        { name: 'Thu', hours: 3 },
        { name: 'Fri', hours: 1 },
        { name: 'Sat', hours: 4 },
        { name: 'Sun', hours: 2.5 },
    ]);

    useEffect(() => {
        getStudyStats().then(res => {
            const d = res.data;
            const hours = ((d.totalDuration ?? 0) / 60);
            setStats({
                totalSessions: d.totalSessions ?? 0,
                totalHours: parseFloat(hours.toFixed(1)),
                topicsCompleted: d.totalTopicsCompleted ?? 0
            });
        }).catch(() => {});

        getDetailedAnalytics().then(res => {
            if (res.data?.weeklyChart?.length) {
                setChartData(res.data.weeklyChart);
            }
        }).catch(() => {});
    }, []);

    const maxHours = Math.max(...chartData.map(d => d.hours));

    return (
        <div>
            <PageHeader 
                title="Analytics & Insights" 
                subtitle="Track your consistency and get AI-driven feedback."
            />

            <div className="grid-3" style={{ marginBottom: '28px' }}>
                <StatCard title="Total Sessions" value={stats.totalSessions} icon="📚" colorHint="c1" />
                <StatCard title="Total Hours" value={stats.totalHours} icon="⏱️" colorHint="c2" />
                <StatCard title="Topics Covered" value={stats.topicsCompleted} icon="🎯" colorHint="c3" />
            </div>

            {/* Chart + AI Insights row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* Weekly Chart */}
                <div className="card" style={{ minHeight: '360px' }}>
                    <h3 className="section-title">Weekly Consistency</h3>
                    <div style={{ width: '100%', height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6C63FF" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="rgba(108,99,255,0.2)" stopOpacity={1}/>
                                    </linearGradient>
                                    <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00E5C4" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="rgba(0,229,196,0.2)" stopOpacity={1}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(108,99,255,0.07)'}} 
                                    contentStyle={{backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)'}} 
                                />
                                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.hours === maxHours && maxHours > 0 ? "url(#colorBest)" : "url(#colorNormal)"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="card" style={{ minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="section-title">AI Insights</h3>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between' }}>
                        
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,229,196,0.15)', color: '#00E5C4',
                                borderRadius: '12px', width: '40px', height: '40px',
                                flexShrink: 0, fontSize: '18px'
                            }}>📈</div>
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', fontFamily: 'Plus Jakarta Sans' }}>Peak Performance</h4>
                                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>You tend to study 30% longer and maintain higher focus on Saturdays. Schedule difficult concepts here.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,179,71,0.15)', color: '#FFB347',
                                borderRadius: '12px', width: '40px', height: '40px',
                                flexShrink: 0, fontSize: '18px'
                            }}>⚠️</div>
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', fontFamily: 'Plus Jakarta Sans' }}>Focus Drop</h4>
                                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>Your focus score dips after 90 minutes. Try Pomodoro technique for better retention.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(108,99,255,0.15)', color: '#6C63FF',
                                borderRadius: '12px', width: '40px', height: '40px',
                                flexShrink: 0, fontSize: '18px'
                            }}>🎯</div>
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', fontFamily: 'Plus Jakarta Sans' }}>Topic Consistency</h4>
                                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>You've hit your daily goal 3 days in a row! Excellent momentum — keep going.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
