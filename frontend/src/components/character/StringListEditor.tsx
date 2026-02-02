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
        <section className="adnd-box rounded-xl p-4">
            <h3 className="text-[10px] font-black adnd-muted-light uppercase tracking-widest mb-3 leading-none">{title}</h3>

            <div className="flex flex-wrap gap-2 mb-3">
                {(items || []).map((item, index) => (
                    <span
                        key={`${item}-${index}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1b1109] border border-[#6b4a2b]/60 rounded-md text-sm text-[#f3e5c5]"
                    >
                        {item}
                        {isDM && (
                            <button
                                onClick={() => handleRemove(index)}
                                className="text-[#c9a361] hover:text-[#e7c37a] focus:outline-none"
                                aria-label="Remove item"
                            >
                                ×
                            </button>
                        )}
                    </span>
                ))}

                {(!items || items.length === 0) && (
                    <p className="text-[10px] adnd-muted-light italic py-1">{emptyMessage}</p>
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
                        className="flex-1 adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
                    />
                    <button
                        onClick={handleAdd}
                        className="px-3 py-1 bg-[#3b2615] hover:bg-[#4b311a] text-[#f3e5c5] text-xs font-bold rounded border border-[#7a4f24] transition-all"
                    >
                        ADD
                    </button>
                </div>
            )}
        </section>
    );
}
