import { useState } from 'react';

interface ClassLevelEditorProps {
    levels: Record<string, number>;
    isDM: boolean;
    onUpdate: (className: string, level: number) => void;
}

const DND_CLASSES = [
    'Barbarian', 'Bard', 'Cleric', 'Druid',
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
            <div className="text-center py-4 adnd-muted text-[10px] uppercase tracking-widest font-bold">
                No class levels assigned
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Total Level Display */}
            {activeClasses.length > 0 && (
                <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[9px] font-black adnd-muted uppercase tracking-widest">Total Level</span>
                    <span className="text-lg font-black text-[#e7c37a] font-mono">{totalLevel}</span>
                </div>
            )}

            {/* Active Classes */}
            <div className="space-y-2">
                {activeClasses.map(([className, level]) => (
                    <div
                        key={className}
                        className={`flex items-center justify-between p-3 adnd-box-soft rounded-xl transition-all ${isDM ? 'hover:border-[#d8b46c] cursor-pointer' : ''}`}
                        onClick={() => startEditingLevel(className, level)}
                    >
                        <span className="text-xs font-black adnd-ink-light uppercase tracking-wider">{className}</span>
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
                                    className="w-12 adnd-input-dark rounded px-1 text-sm text-center font-mono focus:outline-none"
                                />
                                <span className="text-[8px] adnd-muted-light uppercase tracking-tighter">0 removes</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-[#e7c37a] font-mono">{level}</span>
                                {isDM && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdate(className, 0);
                                        }}
                                        className="text-[#b44a3a] hover:text-[#d46a59] transition-colors p-1"
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
                    <div className="p-3 adnd-box rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="flex-1 adnd-input-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#d8b46c]"
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
                                className="w-16 adnd-input-dark rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#d8b46c]"
                                placeholder="Lvl"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setIsAdding(false); setSelectedClass(''); setNewLevel('1'); }}
                                className="px-3 py-1 text-[9px] font-black uppercase tracking-widest adnd-muted-light hover:text-[#f3e5c5] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddClass}
                                disabled={!selectedClass}
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#f3e5c5] bg-[#3b2615] hover:bg-[#4b311a] border border-[#7a4f24] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Class
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[#7a4f24] bg-[#f0dcb4] hover:bg-[#e7d3aa] border border-dashed border-[#7a4f24]/60 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="text-sm">+</span>
                        Add Class Level
                    </button>
                )
            )}
        </div>
    );
}
