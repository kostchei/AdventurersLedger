import { useCharacterStats } from '../hooks/useCharacterStats';

interface FactionRenownProps {
    isDM: boolean;
    statsId?: string;
    campaignId?: string;
    userId?: string;
}

const FACTIONS = [
    "Cult of the Dragon", "Emerald Enclave", "Harpers", "Lords’ Alliance",
    "Order of the Gauntlet", "Purple Dragon Knights", "Red Wizards", "Zhentarim",
    "Fire Knives", "Nine Golden Swords", "Shadow Thieves", "Xanathar Guild",
    "Arcane Brotherhood", "Aurora’s Emporium", "the Howling Hatred", "the Black Earth",
    "the Eternal Flame", "the Crushing Wave", "Flaming Fist", "Kraken Society",
    "Order of Delvers", "Spellguard", "Waterclock Guild"
];

const getRank = (renown: number) => {
    if (renown >= 50) return { title: 'Exalted', color: 'text-[#e7c37a]' };
    if (renown >= 40) return { title: 'Commander', color: 'text-[#d4bf93]' };
    if (renown >= 30) return { title: 'Leader', color: 'text-[#c9a361]' };
    if (renown >= 25) return { title: 'Veteran', color: 'text-[#b68a50]' };
    if (renown >= 15) return { title: 'Senior Agent', color: 'text-[#d4bf93]' };
    if (renown >= 10) return { title: 'Agent', color: 'text-[#c9b087]' };
    if (renown >= 5) return { title: 'Operative', color: 'text-[#b5986a]' };
    if (renown >= 3) return { title: 'Associate', color: 'text-[#a48256]' };
    return { title: 'Stranger', color: 'text-[#8a6a43]' };
};

export default function FactionRenown({ isDM, statsId, campaignId, userId }: FactionRenownProps) {
    const { stats, updateFactionRenown } = useCharacterStats(statsId, campaignId, userId);

    if (!stats) return null;

    const factions = stats.factions || {};

    const handleUpdate = (faction: string, amount: number) => {
        const current = factions[faction] || 0;
        updateFactionRenown(faction, Math.max(0, current + amount));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-[10px] font-black adnd-muted uppercase tracking-[0.2em] mb-4 px-1">Active Allegiances</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 adnd-scrollbar">
                {[...FACTIONS].sort((a, b) => {
                    const renownA = factions[a] || 0;
                    const renownB = factions[b] || 0;
                    // Sort by renown descending, then alphabetically for ties
                    if (renownA !== renownB) return renownB - renownA;
                    return a.localeCompare(b);
                }).map(faction => {
                    const renown = factions[faction] || 0;
                    const rank = getRank(renown);

                    return (
                        <div
                            key={faction}
                            className={`p-4 rounded-2xl border transition-all ${renown > 0 ? 'adnd-box border-[#7a4f24] shadow-lg shadow-[#2a1b10]/30' : 'adnd-box-soft border-[#5c3b1d] opacity-70 hover:opacity-100'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black adnd-ink-light uppercase tracking-wider truncate mb-0.5">{faction}</p>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${rank.color}`}>{rank.title}</p>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-lg font-black text-[#e7c37a] font-mono leading-none">{renown}</div>
                                    <div className="text-[8px] adnd-muted-light font-black uppercase tracking-tighter">Renown</div>
                                </div>
                            </div>

                            {isDM && (
                                <div className="mt-4 pt-3 border-t border-[#5c3b1d]/60 flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => handleUpdate(faction, -1)}
                                        className="h-6 w-6 rounded-lg bg-[#1b1109] border border-[#7a4f24]/70 flex items-center justify-center text-[#d4bf93] hover:text-[#f3e5c5] hover:bg-[#6b2a22] transition-all font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="text-[8px] font-black adnd-muted-light uppercase tracking-widest">Adjust</span>
                                    <button
                                        onClick={() => handleUpdate(faction, 1)}
                                        className="h-6 w-6 rounded-lg bg-[#1b1109] border border-[#7a4f24]/70 flex items-center justify-center text-[#d4bf93] hover:text-[#f3e5c5] hover:bg-[#3b3a22] transition-all font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-[10px] adnd-muted italic text-center px-4 leading-relaxed mt-4">
                Your deeds across the realm earn you influence among these powerful organizations. 10 Renown marks you as a local hero.
            </p>
        </div>
    );
}
