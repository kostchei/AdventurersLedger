import { useState } from 'react';
import { CONDITIONS, type Condition } from '../../constants/conditions';

interface ConditionSelectorProps {
    currentConditions: string[];
    onAddCondition: (condition: string) => void;
}

export default function ConditionSelector({ currentConditions, onAddCondition }: ConditionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const availableConditions = CONDITIONS.filter(
        c => !currentConditions.includes(c.name)
    );

    const filteredConditions = availableConditions.filter(
        c => c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (condition: Condition) => {
        onAddCondition(condition.name);
        setIsOpen(false);
        setSearchTerm('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg transition-all flex items-center gap-1.5"
            >
                <span className="text-sm">+</span>
                Add Condition
            </button>
        );
    }

    return (
        <div className="bg-slate-900/80 rounded-xl border border-indigo-500/30 p-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
                <input
                    autoFocus
                    type="text"
                    placeholder="Search conditions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
                <button
                    onClick={() => { setIsOpen(false); setSearchTerm(''); }}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                {filteredConditions.length === 0 ? (
                    <p className="text-[10px] text-slate-600 text-center py-2">
                        {availableConditions.length === 0 ? 'All conditions applied' : 'No matching conditions'}
                    </p>
                ) : (
                    filteredConditions.map(condition => (
                        <button
                            key={condition.name}
                            onClick={() => handleSelect(condition)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg ${condition.bgColor} ${condition.borderColor} border hover:brightness-125 transition-all group flex items-center gap-2`}
                        >
                            <span className="text-sm">{condition.icon}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${condition.color}`}>
                                {condition.name}
                            </span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
