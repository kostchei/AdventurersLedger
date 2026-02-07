import { useWorldState } from '../hooks/useWorldState';

interface WorldStateProps {
    campaignId?: string;
}

export default function WorldState({ campaignId }: WorldStateProps) {
    const { state, loading, error } = useWorldState(campaignId);

    // `world_state` records can be created by different features and may not include all fields.
    // Always treat missing lists as empty to avoid crashing the campaign page.
    const clearedDungeons: string[] = Array.isArray((state as unknown as { cleared_dungeons_list?: unknown })?.cleared_dungeons_list)
        ? ((state as unknown as { cleared_dungeons_list: string[] }).cleared_dungeons_list)
        : [];

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i}>
                        <div className="animate-pulse h-3 w-20 bg-[#3b2615]/40 rounded mb-3"></div>
                        <div className="animate-pulse h-16 bg-[#3b2615]/20 rounded-lg"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-[#6b2a22]/10 border border-[#7a4f24]/50 rounded-lg text-[#b44a3a] text-xs text-center font-medium">
                The world archives are currently inaccessible.
            </div>
        );
    }

    if (!campaignId) {
        return (
            <div className="adnd-muted text-sm italic text-center py-8 adnd-panel rounded-lg border border-dashed border-[#7a4f24]/50">
                No campaign selected.
            </div>
        );
    }

    if (!state) {
        return (
            <div className="adnd-muted text-sm italic text-center py-8 adnd-panel rounded-lg border border-dashed border-[#7a4f24]/50">
                The world is currently a blank slate.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Dungeon Progress */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[10px] font-black adnd-muted uppercase tracking-widest leading-none">Epic Conquests</h3>
                </div>
                <div className="space-y-2.5">
                    {clearedDungeons.length > 0 ? (
                        clearedDungeons.map(dungeon => (
                            <div
                                key={dungeon}
                                className="flex items-center gap-3 adnd-box-soft border border-[#7a4f24]/60 p-2.5 rounded-lg group hover:border-[#d8b46c] transition-colors"
                            >
                                <span className="text-[#e7c37a] text-lg leading-none select-none">◈</span>
                                <span className="text-sm font-medium adnd-ink-light transition-colors">{dungeon}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs adnd-muted italic px-2">No legendary locales reclaimed yet.</div>
                    )}
                </div>
            </section>

            {/* Note: In a full implementation, Ecological Impact and Persons of Interest 
                might come from separate related collections (Phase 6.4 & 6.5) */}

            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#7a4f24]/40"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-tighter">
                    <span className="bg-[#efe0bf] px-2 adnd-muted">Archives</span>
                </div>
            </div>

            <p className="text-[10px] adnd-muted italic text-center leading-relaxed px-4">
                "The world is changed. I feel it in the water. I feel it in the earth. I smell it in the air."
            </p>
        </div>
    );
}
