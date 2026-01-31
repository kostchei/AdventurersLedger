import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useCharacterStats } from '../hooks/useCharacterStats';
import { characterApi } from '../lib/characterApi';
import AbilityScoreGrid from './character/AbilityScoreGrid';
import ConditionBadge from './character/ConditionBadge';
import ConditionSelector from './character/ConditionSelector';
import ClassLevelEditor from './character/ClassLevelEditor';

interface CharacterStatsProps {
    isDM?: boolean;
    userId?: string;
}

export default function CharacterStats({ isDM = false, userId }: CharacterStatsProps) {
    const {
        stats,
        loading,
        error,
        updateGold,
        addXP,
        updateAbilityScore,
        updateClassLevel,
        addCondition,
        removeCondition
    } = useCharacterStats(userId);
    const [editingStat, setEditingStat] = useState<'gold' | 'xp' | null>(null);
    const [editValue, setEditValue] = useState('');

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse h-16 bg-slate-800/50 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="animate-pulse h-14 bg-slate-800/30 rounded-lg"></div>
                    <div className="animate-pulse h-14 bg-slate-800/30 rounded-lg"></div>
                </div>
                <div className="animate-pulse h-24 bg-slate-800/20 rounded-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-red-500 text-xs text-center font-medium">
                Failed to channel character data.
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-8 bg-slate-900/20 rounded-2xl border border-dashed border-white/5 px-6">
                <div className="text-3xl mb-4 opacity-20">📭</div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">
                    No ledger entry exists for this adventurer.
                </p>
                {isDM && (
                    <button
                        onClick={async () => {
                            if (!userId) return;
                            try {
                                await characterApi.create({
                                    user: userId,
                                    hp: 10,
                                    max_hp: 10,
                                    strength: 10,
                                    dexterity: 10,
                                    constitution: 10,
                                    intelligence: 10,
                                    wisdom: 10,
                                    charisma: 10,
                                    gold: 150, // Default 150gp as requested
                                    xp: 0,
                                    conditions: [],
                                    factions: {},
                                    piety_deity: null,
                                    piety_score: 0,
                                    magic_items: [],
                                    attuned_items: [],
                                    levels: {},
                                    inventory: [],
                                    character_name: "Unnamed Hero",
                                    class_name: "Commoner",
                                    species: "Human",
                                    background: "None",
                                    spells: [],
                                    feats: [],
                                    bastion: []
                                });
                                // refresh happens via subscription
                            } catch (err) {
                                console.error('Failed to create ledger:', err);
                                alert('Failed to create ledger record.');
                            }
                        }}
                        className="px-6 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-500/20 transition-all"
                    >
                        Initialize Ledger
                    </button>
                )}
            </div>
        );
    }

    const startEditing = (type: 'gold' | 'xp', currentVal: number) => {
        if (!isDM) return;
        setEditingStat(type);
        setEditValue(currentVal.toString());
    };

    const handleStatSubmit = async () => {
        const newValue = parseInt(editValue);
        if (isNaN(newValue)) return;

        if (editingStat === 'gold') {
            await updateGold(newValue);
        } else if (editingStat === 'xp') {
            // For XP we use addXP which takes the DELTA, so we calculate difference
            const delta = newValue - stats.xp;
            await addXP(delta);
        }
        setEditingStat(null);
    };

    const conditions = stats.conditions || [];

    return (
        <div className="space-y-6">
            {/* Character Details Section (New) */}
            <section className="bg-slate-800/30 border border-slate-800/50 rounded-xl p-4 shadow-sm backdrop-blur-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Character Name</label>
                        <div className="text-white font-medium">{stats.character_name || "Unknown"}</div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Class</label>
                        <div className="text-white font-medium">{stats.class_name || "Commoner"}</div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Species</label>
                        <div className="text-white font-medium">{stats.species || "Human"}</div>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Background</label>
                        <div className="text-white font-medium">{stats.background || "None"}</div>
                    </div>
                </div>
            </section>

            {/* Vitality (Text Only as requested) */}
            <section className="bg-slate-800/30 border border-slate-800/50 rounded-xl p-4 shadow-sm backdrop-blur-sm flex justify-between items-center">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 leading-none">Hit Points</div>
                    <div className="text-2xl font-bold text-red-400">
                        {stats.hp} <span className="text-slate-600 text-lg">/ {stats.max_hp}</span>
                    </div>
                </div>
            </section>

            {/* Economy & Experience Section */}
            <div className="grid grid-cols-2 gap-3">
                {/* Gold Card */}
                <div
                    onClick={() => startEditing('gold', stats.gold)}
                    className={`bg-slate-800/20 border border-slate-800/40 p-3 rounded-lg text-center transition-all ${isDM ? 'cursor-pointer hover:border-amber-500/50 hover:bg-slate-800/30 active:scale-95' : ''}`}
                >
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 leading-none">Gold Pieces</div>
                    {editingStat === 'gold' ? (
                        <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                            onBlur={handleStatSubmit}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleStatSubmit()}
                            className="w-full bg-slate-900 border border-amber-500 rounded px-1 text-sm text-center text-amber-400 font-mono focus:outline-none"
                        />
                    ) : (
                        <div className="text-amber-400 font-mono text-xl font-bold flex items-baseline justify-center gap-1">
                            {stats.gold}
                            <span className="text-[10px] text-amber-500/60 uppercase font-black">gp</span>
                        </div>
                    )}
                </div>

                {/* XP Card */}
                <div
                    onClick={() => startEditing('xp', stats.xp)}
                    className={`bg-slate-800/20 border border-slate-800/40 p-3 rounded-lg text-center transition-all ${isDM ? 'cursor-pointer hover:border-primary-500/50 hover:bg-slate-800/30 active:scale-95' : ''}`}
                >
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 leading-none">XP / Level</div>
                    {editingStat === 'xp' ? (
                        <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                            onBlur={handleStatSubmit}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleStatSubmit()}
                            className="w-full bg-slate-900 border border-primary-500 rounded px-1 text-sm text-center text-primary-400 font-mono focus:outline-none"
                        />
                    ) : (
                        <div className="text-primary-400 font-mono text-xl font-bold flex items-baseline justify-center gap-1">
                            {stats.xp}
                            <span className="text-[10px] text-primary-500/60 uppercase font-black">xp</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Conditions Section */}
            {(conditions.length > 0 || isDM) && (
                <section>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">Active Afflictions</h3>
                    <div className="flex flex-wrap gap-1.5 items-start">
                        {conditions.map((condition: string) => (
                            <ConditionBadge
                                key={condition}
                                condition={condition}
                                isDM={isDM}
                                onRemove={() => removeCondition(condition)}
                            />
                        ))}
                        {isDM && (
                            <ConditionSelector
                                currentConditions={conditions}
                                onAddCondition={addCondition}
                            />
                        )}
                    </div>
                </section>
            )}

            {/* Feats & Features */}
            <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">Feats & Features</h3>
                <div className="p-3 bg-slate-800/20 rounded-lg text-sm text-slate-400 italic text-center border border-slate-800/40">
                    {stats.feats?.length ? stats.feats.join(', ') : "No feats recorded"}
                </div>
            </section>

            {/* Spells */}
            <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">Spells</h3>
                <div className="p-3 bg-slate-800/20 rounded-lg text-sm text-slate-400 italic text-center border border-slate-800/40">
                    {stats.spells?.length ? stats.spells.join(', ') : "No spells recorded"}
                </div>
            </section>

            {/* Bastion */}
            <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">Bastion</h3>
                <div className="p-3 bg-slate-800/20 rounded-lg text-sm text-slate-400 italic text-center border border-slate-800/40">
                    {stats.bastion?.length ? stats.bastion.join(', ') : "No bastion features"}
                </div>
            </section>

            {/* Class Levels Section */}
            <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">Class Levels</h3>
                <ClassLevelEditor
                    levels={stats.levels || {}}
                    isDM={isDM}
                    onUpdate={updateClassLevel}
                />
            </section>

            {/* Ability Scores Section */}
            <section>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">Attributes</h3>
                <AbilityScoreGrid
                    stats={stats}
                    isDM={isDM}
                    onUpdate={updateAbilityScore}
                />
            </section>
        </div>
    );
}
