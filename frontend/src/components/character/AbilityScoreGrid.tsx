import React, { useState } from 'react';

interface AbilityScoreGridProps {
    stats: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
    compact?: boolean;
    isDM?: boolean;
    onUpdate?: (ability: string, value: number) => void;
}

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

const AbilityScoreGrid: React.FC<AbilityScoreGridProps> = ({ stats, compact = false, isDM = false, onUpdate }) => {
    const [editingAbility, setEditingAbility] = useState<AbilityKey | null>(null);
    const [editValue, setEditValue] = useState('');

    const calculateModifier = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod;
    };

    const abilities: { label: string; full: string; key: AbilityKey; value: number }[] = [
        { label: 'STR', full: 'Strength', key: 'strength', value: stats.strength },
        { label: 'DEX', full: 'Dexterity', key: 'dexterity', value: stats.dexterity },
        { label: 'CON', full: 'Constitution', key: 'constitution', value: stats.constitution },
        { label: 'INT', full: 'Intelligence', key: 'intelligence', value: stats.intelligence },
        { label: 'WIS', full: 'Wisdom', key: 'wisdom', value: stats.wisdom },
        { label: 'CHA', full: 'Charisma', key: 'charisma', value: stats.charisma },
    ];

    const startEditing = (ability: { key: AbilityKey; value: number }) => {
        if (!isDM || !onUpdate) return;
        setEditingAbility(ability.key);
        setEditValue(ability.value.toString());
    };

    const handleSubmit = () => {
        if (!editingAbility || !onUpdate) return;
        const newValue = parseInt(editValue);
        if (!isNaN(newValue) && newValue >= 1 && newValue <= 30) {
            onUpdate(editingAbility, newValue);
        }
        setEditingAbility(null);
        setEditValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setEditingAbility(null);
            setEditValue('');
        }
    };

    return (
        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {abilities.map((ability) => (
                <div
                    key={ability.label}
                    onClick={() => startEditing(ability)}
                    className={`flex flex-col items-center bg-slate-950/40 border border-slate-800/50 p-2 rounded-lg transition-colors hover:border-slate-700 ${isDM && onUpdate ? 'cursor-pointer hover:bg-slate-900/60 active:scale-95' : ''}`}
                    title={isDM ? `Click to edit ${ability.full}` : ability.full}
                >
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
                        {ability.label}
                    </span>
                    {editingAbility === ability.key ? (
                        <input
                            autoFocus
                            type="number"
                            min="1"
                            max="30"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSubmit}
                            onKeyDown={handleKeyDown}
                            className="w-12 bg-slate-900 border border-primary-500 rounded px-1 text-sm text-center text-primary-400 font-mono focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-200">{ability.value}</span>
                            <span className="text-[10px] font-mono text-primary-500 font-bold bg-primary-500/10 px-1 rounded">
                                {calculateModifier(ability.value)}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AbilityScoreGrid;
