import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useCharacterStats } from '../hooks/useCharacterStats';
import { characterApi } from '../lib/characterApi';
import { useCampaignConfig } from '../hooks/useCampaignConfig';
import { generateRandomName } from '../utils/randomName';
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
        updateBastionTurns,
        updateInventory
    } = useCharacterStats(statsId, campaignId, userId);
    const { data: campaignConfig } = useCampaignConfig(campaignId);
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

    const handleDetailUpdate = (
        field:
            | 'character_name'
            | 'class_name'
            | 'subclass'
            | 'species'
            | 'background'
            | 'dndbeyond_character_link',
        value: string
    ) => {
        if (!stats) return;
        updateDetails({
            [field]: value
        });
    };

    const speciesOptions = campaignConfig?.speciesOptions || [];
    const backgroundOptions = campaignConfig?.backgroundOptions || [];
    const classOptions = campaignConfig?.classOptions || [];
    const subclassOptions = campaignConfig?.subclassOptions || {};

    const conditions = stats.conditions || [];
    type BastionTurn = { turn?: number; happenedOn?: string; notes?: string };
    const bastionTurns: BastionTurn[] = Array.isArray(stats.bastion_turns)
        ? (stats.bastion_turns as BastionTurn[]).filter((t) => typeof t === 'object' && t !== null)
        : [];
    const orderedBastionTurns = bastionTurns
        .slice()
        .sort((a, b) => Number(a.turn || 0) - Number(b.turn || 0));

    return (
        <div className="space-y-6">
            {/* Character Details Section */}
            <section className="adnd-box rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Character Name</label>
                            {isDM && (
                                <button
                                    type="button"
                                    onClick={() => handleDetailUpdate('character_name', generateRandomName(campaignConfig, stats.species))}
                                    className="text-[9px] font-black text-[#7a4f24] uppercase tracking-widest hover:text-[#2c1d0f] transition-colors"
                                >
                                    Random
                                </button>
                            )}
                        </div>
                        {isDM ? (
                            <input
                                key={`${stats.id}:${stats.updated}:character_name`}
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
                            <>
                                {classOptions.length ? (
                                    <select
                                        key={`${stats.id}:${stats.updated}:class_name:select`}
                                        value={classOptions.includes(stats.class_name) ? stats.class_name : '__custom__'}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v !== '__custom__') handleDetailUpdate('class_name', v);
                                        }}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                                    >
                                        {classOptions.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="__custom__">Custom...</option>
                                    </select>
                                ) : null}
                                {(!classOptions.length || !classOptions.includes(stats.class_name)) && (
                                    <input
                                        key={`${stats.id}:${stats.updated}:class_name`}
                                        type="text"
                                        defaultValue={stats.class_name}
                                        onBlur={(e) => handleDetailUpdate('class_name', e.target.value)}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c] mt-1"
                                    />
                                )}
                            </>
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.class_name || "Commoner"}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Species</label>
                        {isDM ? (
                            <>
                                {speciesOptions.length ? (
                                    <select
                                        key={`${stats.id}:${stats.updated}:species:select`}
                                        value={speciesOptions.includes(stats.species) ? stats.species : '__custom__'}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v !== '__custom__') handleDetailUpdate('species', v);
                                        }}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                                    >
                                        {speciesOptions.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="__custom__">Custom...</option>
                                    </select>
                                ) : null}
                                {(!speciesOptions.length || !speciesOptions.includes(stats.species)) && (
                                    <input
                                        key={`${stats.id}:${stats.updated}:species`}
                                        type="text"
                                        defaultValue={stats.species}
                                        onBlur={(e) => handleDetailUpdate('species', e.target.value)}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c] mt-1"
                                    />
                                )}
                            </>
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.species || "Human"}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Background</label>
                        {isDM ? (
                            <>
                                {backgroundOptions.length ? (
                                    <select
                                        key={`${stats.id}:${stats.updated}:background:select`}
                                        value={backgroundOptions.includes(stats.background) ? stats.background : '__custom__'}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v !== '__custom__') handleDetailUpdate('background', v);
                                        }}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                                    >
                                        {backgroundOptions.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="__custom__">Custom...</option>
                                    </select>
                                ) : null}
                                {(!backgroundOptions.length || !backgroundOptions.includes(stats.background)) && (
                                    <input
                                        key={`${stats.id}:${stats.updated}:background`}
                                        type="text"
                                        defaultValue={stats.background}
                                        onBlur={(e) => handleDetailUpdate('background', e.target.value)}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c] mt-1"
                                    />
                                )}
                            </>
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.background || "None"}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Subclass</label>
                        {isDM ? (
                            <>
                                {Array.isArray(subclassOptions[stats.class_name]) && subclassOptions[stats.class_name].length ? (
                                    <select
                                        key={`${stats.id}:${stats.updated}:subclass:select`}
                                        value={(subclassOptions[stats.class_name] || []).includes(stats.subclass || '') ? (stats.subclass || '') : '__custom__'}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v !== '__custom__') handleDetailUpdate('subclass', v);
                                        }}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                                    >
                                        {(subclassOptions[stats.class_name] || []).map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="__custom__">Custom...</option>
                                    </select>
                                ) : null}
                                {(!Array.isArray(subclassOptions[stats.class_name]) || !(subclassOptions[stats.class_name] || []).includes(stats.subclass || '')) && (
                                    <input
                                        key={`${stats.id}:${stats.updated}:subclass`}
                                        type="text"
                                        defaultValue={stats.subclass || ''}
                                        onBlur={(e) => handleDetailUpdate('subclass', e.target.value)}
                                        className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c] mt-1"
                                        placeholder="(optional)"
                                    />
                                )}
                            </>
                        ) : (
                            <div className="adnd-ink-light font-medium">{stats.subclass || "—"}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">D&D Beyond</label>
                        {isDM ? (
                            <input
                                key={`${stats.id}:${stats.updated}:dndbeyond_character_link`}
                                type="url"
                                defaultValue={stats.dndbeyond_character_link || ''}
                                onBlur={(e) => handleDetailUpdate('dndbeyond_character_link', e.target.value)}
                                className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                                placeholder="https://www.dndbeyond.com/..."
                            />
                        ) : stats.dndbeyond_character_link ? (
                            <a
                                href={stats.dndbeyond_character_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7a4f24] font-bold text-sm hover:text-[#2c1d0f] underline decoration-[#7a4f24]/30"
                            >
                                Open Character
                            </a>
                        ) : (
                            <div className="adnd-muted-light text-sm italic">—</div>
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

            {/* Bastion Turns */}
            <section className="adnd-box rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[10px] font-black adnd-muted uppercase tracking-widest leading-none">Bastion Turns</h3>
                        <p className="text-[10px] adnd-muted-light mt-2 leading-relaxed">
                            Track bastion turns as a simple per-character log. (Rules meaning is campaign-dependent.)
                        </p>
                    </div>
                    {isDM && (
                        <button
                            type="button"
                            onClick={() => {
                                const nextTurn = (bastionTurns.reduce((m, t) => Math.max(m, Number(t.turn || 0)), 0) || 0) + 1;
                                const happenedOn = new Date().toISOString().slice(0, 10);
                                const updated = [...bastionTurns, { turn: nextTurn, happenedOn, notes: '' }];
                                updateBastionTurns(updated);
                            }}
                            className="px-3 py-1.5 bg-[#3b2615] hover:bg-[#4b311a] text-[#f3e5c5] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg active:scale-95 transition-all"
                        >
                            Add Turn
                        </button>
                    )}
                </div>

                {orderedBastionTurns.length ? (
                    <div className="space-y-2">
                        {orderedBastionTurns.map((t, idx) => (
                            <div key={`${t.turn ?? 't'}:${idx}`} className="adnd-box-soft rounded-xl p-3 border border-[#7a4f24]/50">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#6b4a2b]">
                                            Turn {t.turn ?? '?'}
                                        </div>
                                        {isDM && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = orderedBastionTurns.filter((_, i) => i !== idx);
                                                    updateBastionTurns(updated);
                                                }}
                                                className="text-[9px] font-black text-[#6b2a22] uppercase tracking-widest hover:text-[#2c1d0f] transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Date</label>
                                            {isDM ? (
                                                <input
                                                    key={`${stats.id}:${stats.updated}:bastion_turns:${idx}:date`}
                                                    type="date"
                                                    defaultValue={t.happenedOn || ''}
                                                    onBlur={(e) => {
                                                        const next = orderedBastionTurns.slice();
                                                        const target = next[idx] || {};
                                                        target.happenedOn = e.target.value;
                                                        next[idx] = target;
                                                        updateBastionTurns(next);
                                                    }}
                                                    className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                                                />
                                            ) : (
                                                <div className="adnd-ink-light font-medium text-sm">{t.happenedOn || '—'}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[10px] adnd-muted-light uppercase font-black tracking-widest leading-none">Notes</label>
                                            {isDM ? (
                                                <input
                                                    key={`${stats.id}:${stats.updated}:bastion_turns:${idx}:notes`}
                                                    type="text"
                                                    defaultValue={t.notes || ''}
                                                    onBlur={(e) => {
                                                        const next = orderedBastionTurns.slice();
                                                        const target = next[idx] || {};
                                                        target.notes = e.target.value;
                                                        next[idx] = target;
                                                        updateBastionTurns(next);
                                                    }}
                                                    className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                                                    placeholder="What happened this turn?"
                                                />
                                            ) : (
                                                <div className="adnd-ink-light font-medium text-sm">{t.notes || '—'}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                        ))}
                    </div>
                ) : (
                    <div className="adnd-panel rounded-2xl border border-dashed border-[#7a4f24]/60 p-4 text-center">
                        <p className="text-[10px] adnd-muted italic">No bastion turns logged yet.</p>
                    </div>
                )}
            </section>

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
