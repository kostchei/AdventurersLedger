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
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Cannot see. Auto-fails checks requiring sight. Attacks have disadvantage, attacks against have advantage.'
    },
    {
        name: 'Charmed',
        icon: '💕',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Cannot attack or target charmer with harmful abilities. Charmer has advantage on social checks.'
    },
    {
        name: 'Deafened',
        icon: '🔇',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Cannot hear. Auto-fails checks requiring hearing.'
    },
    {
        name: 'Exhaustion 1',
        icon: '😓',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Disadvantage on ability checks.'
    },
    {
        name: 'Exhaustion 2',
        icon: '😰',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Speed halved. Disadvantage on ability checks.'
    },
    {
        name: 'Exhaustion 3',
        icon: '😫',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Disadvantage on attacks and saves. Speed halved.'
    },
    {
        name: 'Exhaustion 4',
        icon: '🥵',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'HP maximum halved. Disadvantage on attacks and saves.'
    },
    {
        name: 'Exhaustion 5',
        icon: '💀',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Speed reduced to 0. HP maximum halved.'
    },
    {
        name: 'Exhaustion 6',
        icon: '☠️',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Death.'
    },
    {
        name: 'Frightened',
        icon: '😱',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Disadvantage on ability checks and attacks while source of fear is in sight. Cannot willingly move closer to source.'
    },
    {
        name: 'Grappled',
        icon: '🤼',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Speed becomes 0. Cannot benefit from bonuses to speed.'
    },
    {
        name: 'Incapacitated',
        icon: '💫',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Cannot take actions or reactions.'
    },
    {
        name: 'Invisible',
        icon: '👻',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Cannot be seen without magic or special senses. Attacks have advantage, attacks against have disadvantage.'
    },
    {
        name: 'Paralyzed',
        icon: '⚡',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Incapacitated. Cannot move or speak. Auto-fails STR/DEX saves. Attacks have advantage, hits within 5ft are crits.'
    },
    {
        name: 'Petrified',
        icon: '🗿',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Transformed to inanimate substance. Incapacitated, unaware. Resistance to all damage. Immune to poison and disease.'
    },
    {
        name: 'Poisoned',
        icon: '🤢',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Disadvantage on attack rolls and ability checks.'
    },
    {
        name: 'Prone',
        icon: '🛌',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Can only crawl. Disadvantage on attacks. Attacks within 5ft have advantage, ranged have disadvantage.'
    },
    {
        name: 'Restrained',
        icon: '⛓️',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Speed becomes 0. Attacks have disadvantage. Attacks against have advantage. Disadvantage on DEX saves.'
    },
    {
        name: 'Stunned',
        icon: '🌀',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Incapacitated. Cannot move. Can only speak falteringly. Auto-fails STR/DEX saves. Attacks have advantage.'
    },
    {
        name: 'Unconscious',
        icon: '💤',
        color: 'text-[#f3e5c5]',
        bgColor: 'bg-[#2b1b10]',
        borderColor: 'border-[#7a4f24]',
        description: 'Incapacitated. Cannot move or speak. Unaware. Drops held items. Falls prone. Auto-fails STR/DEX saves. Attacks have advantage, crits within 5ft.'
    }
];

export const getConditionByName = (name: string): Condition | undefined => {
    return CONDITIONS.find(c => c.name.toLowerCase() === name.toLowerCase());
};

export const CONDITION_NAMES = CONDITIONS.map(c => c.name);
