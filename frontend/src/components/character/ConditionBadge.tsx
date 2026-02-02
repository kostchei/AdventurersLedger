import { useState } from 'react';
import { getConditionByName } from '../../constants/conditions';

interface ConditionBadgeProps {
    condition: string;
    isDM: boolean;
    onRemove?: () => void;
}

export default function ConditionBadge({ condition, isDM, onRemove }: ConditionBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const conditionData = getConditionByName(condition);

    // Fallback styling for unknown conditions
    const icon = conditionData?.icon || '⚠️';
    const color = conditionData?.color || 'text-[#f3e5c5]';
    const bgColor = conditionData?.bgColor || 'bg-[#2b1b10]';
    const borderColor = conditionData?.borderColor || 'border-[#7a4f24]';
    const description = conditionData?.description || 'Unknown condition effect.';

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 ${bgColor} ${color} border ${borderColor} rounded-md text-[9px] font-black uppercase tracking-wider transition-all hover:brightness-110`}
            >
                <span className="text-xs">{icon}</span>
                {condition}
                {isDM && onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="ml-1 text-[#d46a59] hover:text-[#f08b7a] transition-colors"
                        title="Remove condition"
                    >
                        ×
                    </button>
                )}
            </span>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 adnd-box border-[#7a4f24] rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <p className={`text-[10px] font-bold mb-1 ${color}`}>{condition}</p>
                    <p className="text-[9px] adnd-muted-light leading-relaxed">{description}</p>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#24160c] border-r border-b border-[#7a4f24]"></div>
                </div>
            )}
        </div>
    );
}
