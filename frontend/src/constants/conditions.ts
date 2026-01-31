/**
 * D&D 5e Conditions
 * Constants for all standard conditions with icons, colors, and descriptions
 */

export interface Condition {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
}

export const CONDITIONS: Condition[] = [
    {
        name: 'Blinded',
        icon: '👁️',
        color: 'text-slate-400',
        bgColor: 'bg-slate-900/40',
        borderColor: 'border-slate-700/50',
        description: 'Cannot see. Auto-fails checks requiring sight. Attacks have disadvantage, attacks against have advantage.'
    },
    {
        name: 'Charmed',
        icon: '💕',
        color: 'text-pink-400',
        bgColor: 'bg-pink-900/20',
        borderColor: 'border-pink-700/50',
        description: 'Cannot attack or target charmer with harmful abilities. Charmer has advantage on social checks.'
    },
    {
        name: 'Deafened',
        icon: '🔇',
        color: 'text-slate-400',
        bgColor: 'bg-slate-900/40',
        borderColor: 'border-slate-700/50',
        description: 'Cannot hear. Auto-fails checks requiring hearing.'
    },
    {
        name: 'Exhaustion 1',
        icon: '😓',
        color: 'text-amber-400',
        bgColor: 'bg-amber-900/20',
        borderColor: 'border-amber-700/50',
        description: 'Disadvantage on ability checks.'
    },
    {
        name: 'Exhaustion 2',
        icon: '😰',
        color: 'text-amber-500',
        bgColor: 'bg-amber-900/30',
        borderColor: 'border-amber-600/50',
        description: 'Speed halved. Disadvantage on ability checks.'
    },
    {
        name: 'Exhaustion 3',
        icon: '😫',
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/30',
        borderColor: 'border-orange-600/50',
        description: 'Disadvantage on attacks and saves. Speed halved.'
    },
    {
        name: 'Exhaustion 4',
        icon: '🥵',
        color: 'text-orange-500',
        bgColor: 'bg-orange-900/40',
        borderColor: 'border-orange-500/50',
        description: 'HP maximum halved. Disadvantage on attacks and saves.'
    },
    {
        name: 'Exhaustion 5',
        icon: '💀',
        color: 'text-red-400',
        bgColor: 'bg-red-900/30',
        borderColor: 'border-red-600/50',
        description: 'Speed reduced to 0. HP maximum halved.'
    },
    {
        name: 'Exhaustion 6',
        icon: '☠️',
        color: 'text-red-500',
        bgColor: 'bg-red-900/40',
        borderColor: 'border-red-500/50',
        description: 'Death.'
    },
    {
        name: 'Frightened',
        icon: '😱',
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/20',
        borderColor: 'border-purple-700/50',
        description: 'Disadvantage on ability checks and attacks while source of fear is in sight. Cannot willingly move closer to source.'
    },
    {
        name: 'Grappled',
        icon: '🤼',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-700/50',
        description: 'Speed becomes 0. Cannot benefit from bonuses to speed.'
    },
    {
        name: 'Incapacitated',
        icon: '💫',
        color: 'text-slate-300',
        bgColor: 'bg-slate-800/40',
        borderColor: 'border-slate-600/50',
        description: 'Cannot take actions or reactions.'
    },
    {
        name: 'Invisible',
        icon: '👻',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-900/20',
        borderColor: 'border-cyan-700/50',
        description: 'Cannot be seen without magic or special senses. Attacks have advantage, attacks against have disadvantage.'
    },
    {
        name: 'Paralyzed',
        icon: '⚡',
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-600/50',
        description: 'Incapacitated. Cannot move or speak. Auto-fails STR/DEX saves. Attacks have advantage, hits within 5ft are crits.'
    },
    {
        name: 'Petrified',
        icon: '🗿',
        color: 'text-stone-400',
        bgColor: 'bg-stone-800/40',
        borderColor: 'border-stone-600/50',
        description: 'Transformed to inanimate substance. Incapacitated, unaware. Resistance to all damage. Immune to poison and disease.'
    },
    {
        name: 'Poisoned',
        icon: '🤢',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-700/50',
        description: 'Disadvantage on attack rolls and ability checks.'
    },
    {
        name: 'Prone',
        icon: '🛌',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-700/50',
        description: 'Can only crawl. Disadvantage on attacks. Attacks within 5ft have advantage, ranged have disadvantage.'
    },
    {
        name: 'Restrained',
        icon: '⛓️',
        color: 'text-slate-400',
        bgColor: 'bg-slate-800/40',
        borderColor: 'border-slate-600/50',
        description: 'Speed becomes 0. Attacks have disadvantage. Attacks against have advantage. Disadvantage on DEX saves.'
    },
    {
        name: 'Stunned',
        icon: '🌀',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-900/20',
        borderColor: 'border-indigo-700/50',
        description: 'Incapacitated. Cannot move. Can only speak falteringly. Auto-fails STR/DEX saves. Attacks have advantage.'
    },
    {
        name: 'Unconscious',
        icon: '💤',
        color: 'text-slate-500',
        bgColor: 'bg-slate-900/50',
        borderColor: 'border-slate-700/50',
        description: 'Incapacitated. Cannot move or speak. Unaware. Drops held items. Falls prone. Auto-fails STR/DEX saves. Attacks have advantage, crits within 5ft.'
    }
];

export const getConditionByName = (name: string): Condition | undefined => {
    return CONDITIONS.find(c => c.name.toLowerCase() === name.toLowerCase());
};

export const CONDITION_NAMES = CONDITIONS.map(c => c.name);
