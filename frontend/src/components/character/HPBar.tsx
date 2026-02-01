import React, { useState } from 'react';

interface HPBarProps {
    hp: number;
    maxHp: number;
    showLabel?: boolean;
    isDM?: boolean;
    onHPChange?: (newHP: number) => void;
    onMaxHPChange?: (newMax: number) => void;
}

const HPBar: React.FC<HPBarProps> = ({ hp, maxHp, showLabel = true, isDM = false, onHPChange, onMaxHPChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const [isEditingMax, setIsEditingMax] = useState(false);
    const [editMaxValue, setEditMaxValue] = useState('');

    const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

    const getBarColor = () => {
        if (hpPercent < 25) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
        if (hpPercent < 50) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
        return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    };

    const handleSubmit = () => {
        const newHP = parseInt(editValue);
        // Allow setting HP > maxHp temporarily if the user intends it (e.g. temp HP or overload), 
        // but typically it's capped. However, the original logic checked <= maxHp. 
        // Let's keep strictness for now but allow 0.
        if (!isNaN(newHP) && newHP >= 0 && onHPChange) {
            onHPChange(newHP);
        }
        setIsEditing(false);
        setEditValue('');
    };

    const handleMaxSubmit = () => {
        const newMax = parseInt(editMaxValue);
        if (!isNaN(newMax) && newMax > 0 && onMaxHPChange) {
            onMaxHPChange(newMax);
        }
        setIsEditingMax(false);
        setEditMaxValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue('');
        }
    };

    const handleMaxKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleMaxSubmit();
        if (e.key === 'Escape') {
            setIsEditingMax(false);
            setEditMaxValue('');
        }
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vitality</span>
                    <div className="flex items-center gap-1">
                        {/* Current HP */}
                        {isEditing ? (
                            <div className="flex items-center">
                                <input
                                    autoFocus
                                    type="number"
                                    min="0"
                                    max={maxHp}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleSubmit}
                                    onKeyDown={handleKeyDown}
                                    className="w-12 bg-slate-900 border border-emerald-500 rounded px-1 text-sm text-center text-emerald-400 font-mono focus:outline-none"
                                />
                            </div>
                        ) : (
                            <span
                                onClick={() => { if (isDM && onHPChange) { setIsEditing(true); setIsEditingMax(false); setEditValue(hp.toString()); } }}
                                className={`text-sm font-mono text-white font-bold ${isDM && onHPChange ? 'cursor-pointer hover:text-emerald-400 transition-colors' : ''}`}
                                title={isDM && onHPChange ? 'Click to edit Current HP' : undefined}
                            >
                                {hp}
                            </span>
                        )}

                        <span className="text-slate-500 mx-0.5">/</span>

                        {/* Max HP */}
                        {isEditingMax ? (
                            <div className="flex items-center">
                                <input
                                    autoFocus
                                    type="number"
                                    min="1"
                                    value={editMaxValue}
                                    onChange={(e) => setEditMaxValue(e.target.value)}
                                    onBlur={handleMaxSubmit}
                                    onKeyDown={handleMaxKeyDown}
                                    className="w-12 bg-slate-900 border border-emerald-500 rounded px-1 text-sm text-center text-white font-mono focus:outline-none"
                                />
                            </div>
                        ) : (
                            <span
                                onClick={() => { if (isDM && onMaxHPChange) { setIsEditingMax(true); setIsEditing(false); setEditMaxValue(maxHp.toString()); } }}
                                className={`text-sm font-mono text-white font-bold ${isDM && onMaxHPChange ? 'cursor-pointer hover:text-emerald-400 transition-colors' : ''}`}
                                title={isDM && onMaxHPChange ? 'Click to edit Max HP' : undefined}
                            >
                                {maxHp}
                            </span>
                        )}
                        <span className="text-[10px] text-slate-500 ml-1">HP</span>
                    </div>
                </div>
            )}
            <div className="h-2.5 w-full bg-slate-900/80 rounded-full overflow-hidden border border-slate-950/50 p-[1px]">
                <div
                    className={`h-full transition-all duration-700 ease-out rounded-full ${getBarColor()}`}
                    style={{ width: `${hpPercent}%` }}
                ></div>
            </div>
            {hpPercent < 15 && (
                <div className="mt-1 text-[9px] text-red-500 font-bold uppercase tracking-tighter animate-pulse">
                    Critical Condition
                </div>
            )}
        </div>
    );
};

export default HPBar;
