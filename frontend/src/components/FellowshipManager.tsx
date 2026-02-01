import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterApi } from '../lib/characterApi';
import type { UserStats } from '../types/pocketbase';
import { useAuthStore } from '../store/authStore';

interface FellowshipManagerProps {
    campaignId: string;
    isDM: boolean;
}

export default function FellowshipManager({ campaignId, isDM }: FellowshipManagerProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [characters, setCharacters] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const loadCharacters = async () => {
        try {
            setLoading(true);
            const allChars = await characterApi.getAllCharacters();
            setCharacters(allChars || []);
        } catch (error) {
            console.error('Failed to fetch fellowship:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCharacters();
    }, []);

    const handleCreateNew = async () => {
        if (!user || creating) return;

        try {
            setCreating(true);
            const newChar = await characterApi.create({
                user: user.id, // Assign to current user (likely GM) initially
                character_name: "Unnamed Hero",
                class_name: "Commoner",
                species: "Human",
                background: "None",
                hp: 10,
                max_hp: 10,
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
                xp: 0,
                gold: 0,
                conditions: [],
                factions: {},
                piety_deity: null,
                piety_score: 0,
                levels: {},
                spells: [],
                feats: [],
                bastion: [],
                inventory: [],
                magic_items: [],
                attuned_items: []
            });
            await loadCharacters();
            // Automatically navigate to edit the new character
            navigate(`/campaign/${campaignId}/stats/${newChar.user}`);
        } catch (error) {
            console.error('Failed to create character:', error);
            alert('Failed to summon new hero.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-slate-500 animate-pulse">Consulting the archives...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">The Fellowship</h2>
                    <p className="text-xs text-slate-400 font-medium">Manage active adventurers</p>
                </div>
                {isDM && (
                    <button
                        onClick={handleCreateNew}
                        disabled={creating}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {creating ? (
                            <>
                                <span className="animate-spin">⚔️</span> Summoning...
                            </>
                        ) : (
                            <>
                                <span>➕</span> Make New Character
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((char) => (
                    <div
                        key={char.id}
                        onClick={() => navigate(`/campaign/${campaignId}/stats/${char.user}`)}
                        className="bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition-all group relative overflow-hidden"
                    >
                        {/* Class Color Strip */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 group-hover:w-1.5 transition-all"></div>

                        <div className="pl-3">
                            <h3 className="text-white font-bold text-lg group-hover:text-indigo-400 transition-colors">
                                {char.character_name || "Unnamed Hero"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono uppercase">
                                <span className="text-slate-300">{char.species}</span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <span className="text-emerald-400">Lvl {Object.values(char.levels || {}).reduce((a, b) => a + b, 0) || 1}</span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <span className="text-slate-300">{char.class_name}</span>
                            </div>

                            {/* Stats Summary */}
                            <div className="mt-4 flex gap-4 text-xs font-bold">
                                <div className="text-red-400" title="Vitality">
                                    ❤️ {char.hp}/{char.max_hp}
                                </div>
                                <div className="text-amber-400" title="Gold">
                                    🪙 {char.gold}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {characters.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <p className="mb-2 text-2xl">🕸️</p>
                        <p className="uppercase tracking-widest text-xs font-bold">The fellowship hall is empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}
