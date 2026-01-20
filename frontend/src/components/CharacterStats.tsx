import { useEffect, useState } from 'react';
import { pb } from '../lib/pb';
import { useAuthStore } from '../store/authStore';

interface Stats {
    hp: number;
    max_hp: number;
    xp: number;
    gold: number;
    conditions: string[];
    stats: Record<string, number>;
}

export default function CharacterStats() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                const record = await pb.collection('users_stats').getFirstListItem(`user="${user.id}"`);
                setStats({
                    hp: record.hp,
                    max_hp: record.max_hp,
                    xp: record.xp,
                    gold: record.gold,
                    conditions: record.conditions || [],
                    stats: record.stats || {},
                });
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Subscribe to changes
        pb.collection('users_stats').subscribe('*', (e) => {
            if (e.action === 'update' && e.record.user === user.id) {
                setStats({
                    hp: e.record.hp,
                    max_hp: e.record.max_hp,
                    xp: e.record.xp,
                    gold: e.record.gold,
                    conditions: e.record.conditions || [],
                    stats: e.record.stats || {},
                });
            }
        });

        return () => {
            pb.collection('users_stats').unsubscribe('*');
        };
    }, [user]);

    if (loading) return <div className="animate-pulse h-20 bg-gray-800 rounded-lg"></div>;
    if (!stats) return <div className="text-gray-500 text-sm italic">No character data found for this campaign.</div>;

    const hpPercent = (stats.hp / stats.max_hp) * 100;

    return (
        <div className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 shadow-inner">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Vitality</span>
                    <span className="text-sm font-mono text-white">{stats.hp} / {stats.max_hp} HP</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-950">
                    <div
                        className={`h-full transition-all duration-500 ${hpPercent < 25 ? 'bg-red-500' : hpPercent < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${hpPercent}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/30 border border-gray-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Fortune</div>
                    <div className="text-amber-400 font-mono text-lg font-bold">{stats.gold} <span className="text-[10px] uppercase">gp</span></div>
                </div>
                <div className="bg-gray-800/30 border border-gray-800 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Experience</div>
                    <div className="text-primary-400 font-mono text-lg font-bold">{stats.xp}</div>
                </div>
            </div>

            {stats.conditions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {stats.conditions.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-red-900/30 text-red-400 border border-red-900/50 rounded text-[10px] font-bold uppercase">
                            {c}
                        </span>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4">
                {Object.entries(stats.stats).map(([stat, val]) => (
                    <div key={stat} className="flex flex-col items-center bg-gray-950/50 p-2 rounded border border-gray-900">
                        <span className="text-[10px] text-gray-600 font-black uppercase">{stat}</span>
                        <span className="text-sm font-bold text-gray-300">{val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
