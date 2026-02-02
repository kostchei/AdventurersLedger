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
                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#7a4f24] bg-[#f0dcb4] hover:bg-[#e7d3aa] border border-[#7a4f24]/60 rounded-lg transition-all flex items-center gap-1.5"
            >
                <span className="text-sm">+</span>
                Add Condition
            </button>
        );
    }

    return (
        <div className="adnd-box rounded-xl border border-[#7a4f24] p-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
                <input
                    autoFocus
                    type="text"
                    placeholder="Search conditions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-xs adnd-ink-light placeholder:text-[#a48256] focus:outline-none"
                />
                <button
                    onClick={() => { setIsOpen(false); setSearchTerm(''); }}
                    className="text-[#c9a361] hover:text-[#f3e5c5] transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="max-h-48 overflow-y-auto adnd-scrollbar space-y-1">
                {filteredConditions.length === 0 ? (
                    <p className="text-[10px] adnd-muted-light text-center py-2">
                        {availableConditions.length === 0 ? 'All conditions applied' : 'No matching conditions'}
                    </p>
                ) : (
                    filteredConditions.map(condition => (
                        <button
                            key={condition.name}
                            onClick={() => handleSelect(condition)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg ${condition.bgColor} ${condition.borderColor} border hover:brightness-110 transition-all group flex items-center gap-2`}
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
