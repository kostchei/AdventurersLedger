import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useCharacterStats } from '../hooks/useCharacterStats';
import { characterApi } from '../lib/characterApi';
import AbilityScoreGrid from './character/AbilityScoreGrid';
import ConditionBadge from './character/ConditionBadge';
import ConditionSelector from './character/ConditionSelector';
import ClassLevelEditor from './character/ClassLevelEditor';
import StringListEditor from './character/StringListEditor';
import HPBar from './character/HPBar';

interface CharacterStatsProps {
    isDM?: boolean;
    userId?: string;
    campaignId?: string;
    statsId?: string;
}

export default function CharacterStats({ isDM = false, userId, campaignId, statsId }: CharacterStatsProps) {
    const {
        stats,
        loading,
        error,
        updateHP,
        updateMaxHP,
        updateGold,
        addXP,
        updateAbilityScore,
        updateClassLevel,
        addCondition,
        removeCondition,
        updateDetails,
        updateSpells,
        updateFeats,
        updateBastion,
        updateInventory
    } = useCharacterStats(statsId, campaignId, userId);
    const [editingStat, setEditingStat] = useState<'gold' | 'xp' | null>(null);
    const [editValue, setEditValue] = useState('');

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse h-16 bg-[#3b2615]/50 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="animate-pulse h-14 bg-[#3b2615]/40 rounded-lg"></div>
                    <div className="animate-pulse h-14 bg-[#3b2615]/40 rounded-lg"></div>
                </div>
                <div className="animate-pulse h-24 bg-[#3b2615]/30 rounded-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-[#6b2a22]/10 border border-[#7a4f24]/50 rounded-lg text-[#b44a3a] text-xs text-center font-medium">
                Failed to channel character data.
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-8 adnd-panel rounded-2xl border border-dashed border-[#7a4f24]/60 px-6">
                <div className="text-3xl mb-4 opacity-30">📭</div>
                <p className="adnd-muted text-xs font-bold uppercase tracking-widest mb-6">
                    No ledger entry exists for this adventurer.
                </p>
                {isDM && (
                    <button
                        onClick={async () => {
                            try {
                                if (!campaignId) {
                                    throw new Error('Missing campaign id.');
                                }
                                await characterApi.createForCampaign(campaignId);
                            } catch (err) {
                                console.error('Failed to create ledger:', err);
                                alert('Failed to create ledger record.');
                            }
                        }}
                        className="px-6 py-2 bg-[#efe0bf] hover:bg-[#e7d3aa] text-[#2c1d0f] text-[10px] font-black uppercase tracking-widest rounded-xl border border-[#7a4f24]/50 transition-all"
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

    const handleDetailUpdate = (field: 'character_name' | 'class_name' | 'species' | 'background', value: string) => {
        if (!stats) return;
        updateDetails({
            [field]: value
        });
    };

    const conditions = stats.conditions || [];

    return (
        <div className="space-y-6">
            {/* Character Details Section */}
            <section className="adnd-box rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Character Name</label>
                        {isDM ? (
                            <input
                                type="text"
                                defaultValue={stats.character_name}
                                onBlur={(e) => handleDetailUpdate('character_name', e.target.value)}
                                className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                            />
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.character_name || "Unknown"}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Class</label>
                        {isDM ? (
                            <input
                                type="text"
                                defaultValue={stats.class_name}
                                onBlur={(e) => handleDetailUpdate('class_name', e.target.value)}
                                className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                            />
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.class_name || "Commoner"}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Species</label>
                        {isDM ? (
                            <input
                                type="text"
                                defaultValue={stats.species}
                                onBlur={(e) => handleDetailUpdate('species', e.target.value)}
                                className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                            />
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.species || "Human"}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Background</label>
                        {isDM ? (
                            <input
                                type="text"
                                defaultValue={stats.background}
                                onBlur={(e) => handleDetailUpdate('background', e.target.value)}
                                className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                            />
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.background || "None"}</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Vitality */}
            <section className="adnd-box rounded-xl p-4 flex justify-between items-center">
                <HPBar
                    hp={stats.hp}
                    maxHp={stats.max_hp}
                    isDM={isDM}
                    onHPChange={updateHP}
                    onMaxHPChange={updateMaxHP}
                    showLabel={true}
                />
            </section>

            {/* Economy & Experience Section */}
            <div className="grid grid-cols-2 gap-3">
                {/* Gold Card */}
                <div
                    onClick={() => startEditing('gold', stats.gold)}
                    className={`adnd-box rounded-lg p-3 text-center transition-all ${isDM ? 'cursor-pointer hover:border-[#d8b46c] active:scale-95' : ''}`}
                >
                    <div className="text-[10px] adnd-muted-light uppercase font-black tracking-widest mb-1.5 leading-none">Gold Pieces</div>
                    {editingStat === 'gold' ? (
                        <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                            onBlur={handleStatSubmit}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleStatSubmit()}
                            className="w-full adnd-input-dark rounded px-1 text-sm text-center font-mono focus:outline-none"
                        />
                    ) : (
                        <div className="text-[#e7c37a] font-mono text-xl font-bold flex items-baseline justify-center gap-1">
                            {stats.gold}
                            <span className="text-[10px] text-[#c9a361] uppercase font-black">gp</span>
                        </div>
                    )}
                </div>

                {/* XP Card */}
                <div
                    onClick={() => startEditing('xp', stats.xp)}
                    className={`adnd-box rounded-lg p-3 text-center transition-all ${isDM ? 'cursor-pointer hover:border-[#d8b46c] active:scale-95' : ''}`}
                >
                    <div className="text-[10px] adnd-muted-light uppercase font-black tracking-widest mb-1.5 leading-none">XP / Level</div>
                    {editingStat === 'xp' ? (
                        <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                            onBlur={handleStatSubmit}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleStatSubmit()}
                            className="w-full adnd-input-dark rounded px-1 text-sm text-center font-mono focus:outline-none"
                        />
                    ) : (
                        <div className="text-[#d99a5a] font-mono text-xl font-bold flex items-baseline justify-center gap-1">
                            {stats.xp}
                            <span className="text-[10px] text-[#c08143] uppercase font-black">xp</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Conditions Section */}
            {(conditions.length > 0 || isDM) && (
                <section>
                    <h3 className="text-[10px] font-black adnd-muted uppercase tracking-widest mb-3 leading-none">Active Afflictions</h3>
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
            <StringListEditor
                title="Feats & Features"
                items={stats.feats || []}
                onUpdate={(items) => updateFeats && updateFeats(items)}
                isDM={isDM}
                placeholder="Add feat..."
            />

            {/* Spells */}
            <StringListEditor
                title="Spells"
                items={stats.spells || []}
                onUpdate={(items) => updateSpells && updateSpells(items)}
                isDM={isDM}
                placeholder="Add spell..."
            />

            {/* Bastion */}
            <StringListEditor
                title="Bastion"
                items={stats.bastion || []}
                onUpdate={(items) => updateBastion && updateBastion(items)}
                isDM={isDM}
                placeholder="Add bastion feature..."
            />

            {/* Inventory */}
            <StringListEditor
                title="Inventory"
                items={stats.inventory || []}
                onUpdate={(items) => updateInventory && updateInventory(items)}
                isDM={isDM}
                placeholder="Add item..."
            />

            {/* Class Levels Section */}
            <section>
                <h3 className="text-[10px] font-black adnd-muted uppercase tracking-widest mb-3 leading-none">Class Levels</h3>
                <ClassLevelEditor
                    levels={stats.levels || {}}
                    isDM={isDM}
                    onUpdate={updateClassLevel}
                />
            </section>

            {/* Ability Scores Section */}
            <section>
                <h3 className="text-[10px] font-black adnd-muted uppercase tracking-widest mb-3 leading-none">Attributes</h3>
                <AbilityScoreGrid
                    stats={stats}
                    isDM={isDM}
                    onUpdate={updateAbilityScore}
                />
            </section>
        </div>
    );
}
