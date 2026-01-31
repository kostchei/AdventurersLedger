import { useState, type KeyboardEvent } from 'react';

interface StringListEditorProps {
    title: string;
    items: string[];
    onUpdate: (items: string[]) => void;
    isDM: boolean;
    placeholder?: string;
    emptyMessage?: string;
}

export default function StringListEditor({
    title,
    items = [],
    onUpdate,
    isDM,
    placeholder = "Add new item...",
    emptyMessage = "None recorded"
}: StringListEditorProps) {
    const [newItem, setNewItem] = useState('');

    // Hide completely if not DM and empty
    if (!isDM && (!items || items.length === 0)) {
        return null;
    }

    const handleAdd = () => {
        if (!newItem.trim()) return;
        onUpdate([...(items || []), newItem.trim()]);
        setNewItem('');
    };

    const handleRemove = (index: number) => {
        const newItems = [...(items || [])];
        newItems.splice(index, 1);
        onUpdate(newItems);
    };

    return (
        <section className="bg-slate-800/30 border border-slate-800/50 rounded-xl p-4 shadow-sm backdrop-blur-sm">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">{title}</h3>

            <div className="flex flex-wrap gap-2 mb-3">
                {(items || []).map((item, index) => (
                    <span
                        key={`${item}-${index}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/50 border border-slate-700 rounded-md text-sm text-slate-300"
                    >
                        {item}
                        {isDM && (
                            <button
                                onClick={() => handleRemove(index)}
                                className="text-slate-500 hover:text-red-400 focus:outline-none"
                                aria-label="Remove item"
                            >
                                ×
                            </button>
                        )}
                    </span>
                ))}

                {(!items || items.length === 0) && (
                    <p className="text-[10px] text-slate-600 italic py-1">{emptyMessage}</p>
                )}
            </div>

            {isDM && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAdd()}
                        placeholder={placeholder}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold rounded border border-indigo-500/20 transition-all"
                    >
                        ADD
                    </button>
                </div>
            )}
        </section>
    );
}
