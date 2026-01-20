import { useEffect, useState } from 'react';
import { pb } from '../lib/pb';

interface WorldStateData {
    cleared_dungeons: string[];
    monster_kills: Record<string, number>;
    discovered_npcs: Array<{ name: string; location: string; status: string }>;
}

export default function WorldState() {
    const [worldData, setWorldData] = useState<WorldStateData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorldState = async () => {
            try {
                // Assume first record for now
                const record = await pb.collection('world_state').getFirstListItem('');
                setWorldData({
                    cleared_dungeons: record.cleared_dungeons || [],
                    monster_kills: record.monster_kills || {},
                    discovered_npcs: record.discovered_npcs || [],
                });
            } catch (err) {
                console.error('Failed to fetch world state:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorldState();

        pb.collection('world_state').subscribe('*', (e) => {
            if (e.action === 'update') {
                setWorldData({
                    cleared_dungeons: e.record.cleared_dungeons || [],
                    monster_kills: e.record.monster_kills || {},
                    discovered_npcs: e.record.discovered_npcs || [],
                });
            }
        });

        return () => {
            pb.collection('world_state').unsubscribe('*');
        };
    }, []);

    if (loading) return <div className="space-y-4">{[1, 2].map(i => <div key={i} className="animate-pulse h-16 bg-gray-800 rounded-lg"></div>)}</div>;
    if (!worldData) return null;

    return (
        <div className="space-y-6">
            <section>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Dungeon Progress</h3>
                <div className="space-y-2">
                    {worldData.cleared_dungeons.length > 0 ? (
                        worldData.cleared_dungeons.map(d => (
                            <div key={d} className="flex items-center gap-2 text-sm text-emerald-400">
                                <span className="text-emerald-500">◈</span> {d}
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-600 italic">No legendary locales reclaimed yet.</div>
                    )}
                </div>
            </section>

            <section>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Ecological Impact</h3>
                <div className="bg-gray-800/20 rounded-lg border border-gray-800 divide-y divide-gray-800/50">
                    {Object.entries(worldData.monster_kills).length > 0 ? (
                        Object.entries(worldData.monster_kills).map(([monster, count]) => (
                            <div key={monster} className="flex justify-between p-3 text-sm">
                                <span className="text-gray-400">{monster}</span>
                                <span className="text-white font-mono">{count}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-sm text-gray-600 italic">The local fauna remains undisturbed.</div>
                    )}
                </div>
            </section>

            <section>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Known Persons</h3>
                <div className="space-y-3">
                    {worldData.discovered_npcs.length > 0 ? (
                        worldData.discovered_npcs.map(npc => (
                            <div key={npc.name} className="bg-gray-950/40 p-3 rounded border border-gray-900">
                                <div className="text-sm font-bold text-gray-200">{npc.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase mt-1">Location: {npc.location}</div>
                                <div className="text-[10px] text-primary-500 font-bold mt-0.5">{npc.status}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-600 italic">No significant allies or enemies discovered.</div>
                    )}
                </div>
            </section>
        </div>
    );
}
