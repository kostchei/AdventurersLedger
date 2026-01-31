import { useState } from 'react';

interface ClassLevelEditorProps {
    levels: Record<string, number>;
    isDM: boolean;
    onUpdate: (className: string, level: number) => void;
}

const DND_CLASSES = [
    'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid',
    'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue',
    'Sorcerer', 'Warlock', 'Wizard'
];

export default function ClassLevelEditor({ levels, isDM, onUpdate }: ClassLevelEditorProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [newLevel, setNewLevel] = useState('1');
    const [editingClass, setEditingClass] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const totalLevel = Object.values(levels).reduce((sum, lvl) => sum + lvl, 0);
    const activeClasses = Object.entries(levels).filter(([, lvl]) => lvl > 0);
    const availableClasses = DND_CLASSES.filter(c => !levels[c] || levels[c] === 0);

    const handleAddClass = () => {
        if (!selectedClass || !newLevel) return;
        const level = parseInt(newLevel);
        if (isNaN(level) || level < 1 || level > 20) return;
        onUpdate(selectedClass, level);
        setIsAdding(false);
        setSelectedClass('');
        setNewLevel('1');
    };

    const startEditingLevel = (className: string, currentLevel: number) => {
        if (!isDM) return;
        setEditingClass(className);
        setEditValue(currentLevel.toString());
    };

    const handleEditSubmit = () => {
        if (!editingClass) return;
        const level = parseInt(editValue);
        if (!isNaN(level) && level >= 0 && level <= 20) {
            onUpdate(editingClass, level);
        }
        setEditingClass(null);
        setEditValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEditSubmit();
        } else if (e.key === 'Escape') {
            setEditingClass(null);
            setEditValue('');
        }
    };

    if (activeClasses.length === 0 && !isDM) {
        return (
            <div className="text-center py-4 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
                No class levels assigned
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Total Level Display */}
            {activeClasses.length > 0 && (
                <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Level</span>
                    <span className="text-lg font-black text-primary-400 font-mono">{totalLevel}</span>
                </div>
            )}

            {/* Active Classes */}
            <div className="space-y-2">
                {activeClasses.map(([className, level]) => (
                    <div
                        key={className}
                        className={`flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl transition-all ${isDM ? 'hover:border-slate-700 cursor-pointer' : ''}`}
                        onClick={() => startEditingLevel(className, level)}
                    >
                        <span className="text-xs font-black text-white uppercase tracking-wider">{className}</span>
                        {editingClass === className ? (
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleEditSubmit}
                                    onKeyDown={handleKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 bg-slate-900 border border-primary-500 rounded px-1 text-sm text-center text-primary-400 font-mono focus:outline-none"
                                />
                                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">0 removes</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-primary-400 font-mono">{level}</span>
                                {isDM && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdate(className, 0);
                                        }}
                                        className="text-red-500/50 hover:text-red-400 transition-colors p-1"
                                        title="Remove class"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Class (DM Only) */}
            {isDM && (
                isAdding ? (
                    <div className="p-3 bg-slate-900/60 border border-indigo-500/30 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">Select class...</option>
                                {availableClasses.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={newLevel}
                                onChange={(e) => setNewLevel(e.target.value)}
                                className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Lvl"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setIsAdding(false); setSelectedClass(''); setNewLevel('1'); }}
                                className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddClass}
                                disabled={!selectedClass}
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Class
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full px-3 py-2 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-dashed border-indigo-500/30 hover:border-indigo-500/50 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="text-sm">+</span>
                        Add Class Level
                    </button>
                )
            )}
        </div>
    );
}
