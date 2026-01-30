import React from 'react';

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
}

const AbilityScoreGrid: React.FC<AbilityScoreGridProps> = ({ stats, compact = false }) => {
    const calculateModifier = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod;
    };

    const abilities = [
        { label: 'STR', full: 'Strength', value: stats.strength },
        { label: 'DEX', full: 'Dexterity', value: stats.dexterity },
        { label: 'CON', full: 'Constitution', value: stats.constitution },
        { label: 'INT', full: 'Intelligence', value: stats.intelligence },
        { label: 'WIS', full: 'Wisdom', value: stats.wisdom },
        { label: 'CHA', full: 'Charisma', value: stats.charisma },
    ];

    return (
        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {abilities.map((ability) => (
                <div
                    key={ability.label}
                    className="flex flex-col items-center bg-slate-950/40 border border-slate-800/50 p-2 rounded-lg transition-colors hover:border-slate-700"
                    title={ability.full}
                >
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
                        {ability.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-200">{ability.value}</span>
                        <span className="text-[10px] font-mono text-primary-500 font-bold bg-primary-500/10 px-1 rounded">
                            {calculateModifier(ability.value)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AbilityScoreGrid;
