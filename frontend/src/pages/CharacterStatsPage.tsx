import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { campaignApi } from '../lib/campaigns';
import { pb } from '../lib/pb';
import CharacterStats from '../components/CharacterStats';
import FactionRenown from '../components/FactionRenown';
import DivinePiety from '../components/DivinePiety';
import { useAuthStore } from '../store/authStore';
import type { PBUser, UserStats } from '../types';

export default function CharacterStatsPage() {
    const { campaignId, statsId } = useParams<{ campaignId: string; statsId?: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    // Fetch character stats to find out which user it belongs to
    type UserStatsRecord = UserStats & { expand?: { user?: PBUser } };

    const { data: stats, isLoading: isStatsLoading } = useQuery<UserStatsRecord | null>({
        queryKey: ['stats', statsId],
        queryFn: async () => {
            if (!statsId) return null;
            return pb.collection('users_stats').getOne<UserStatsRecord>(statsId, {
                expand: 'user',
            });
        },
        enabled: !!statsId,
    });

    const targetUserId = stats?.user || null;

    // Fetch target user info if it's not the current user and not expanded already
    const { data: targetUser, isLoading: isUserLoading } = useQuery({
        queryKey: ['user', targetUserId],
        queryFn: async () => {
            if (!targetUserId) return null;
            return pb.collection('users').getOne(targetUserId);
        },
        enabled: !!targetUserId && targetUserId !== currentUser?.id && !stats?.expand?.user,
    });

    const displayUser = stats?.expand?.user || (targetUserId === currentUser?.id || !targetUserId ? currentUser : targetUser);
    const displayAvatarUrl = (() => {
        if (!displayUser) return null;
        if ('avatarUrl' in displayUser && displayUser.avatarUrl) {
            return displayUser.avatarUrl;
        }
        if ('avatar' in displayUser && displayUser.avatar) {
            return pb.files.getURL(displayUser, displayUser.avatar);
        }
        return null;
    })();

    const { data: campaign, isLoading: isCampaignLoading } = useQuery({
        queryKey: ['campaign', campaignId],
        queryFn: () => campaignApi.getCampaign(campaignId!),
        enabled: !!campaignId,
    });

    const isDM = currentUser?.id === campaign?.dmId;
    const isTargetingSelf = stats ? stats.user === currentUser?.id : true;
    // Allow players to edit their own character sheet; DM can edit anyone.
    const canEdit = isDM || isTargetingSelf;
    const totalLevel = stats?.levels
        ? Object.values(stats.levels).reduce((sum, value) => sum + value, 0)
        : 0;
    const displayLevel = totalLevel > 0 ? totalLevel : 1;
    const displayName = stats?.character_name || displayUser?.name || 'Adventurer';
    const displaySpecies = stats?.species || null;
    const displayClass = stats?.class_name || null;

    if (isCampaignLoading || isStatsLoading || (targetUserId && targetUserId !== currentUser?.id && isUserLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center adnd-page">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7a4f24]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen adnd-page font-adnd selection:bg-[#d8b46c]/40 pb-12">
            {/* Header */}
            <header className="h-16 bg-[#e7d3aa]/90 backdrop-blur-sm border-b border-[#3b2a18]/30 flex items-center justify-between px-6 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/campaign/${campaignId}`)}
                        className="p-2 rounded-lg transition-colors text-[#6b4a2b] hover:text-[#2c1d0f] hover:bg-[#efe0bf]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-sm adnd-display text-[#2c1d0f] uppercase tracking-[0.3em]">{campaign?.name}</h1>
                        <p className="text-[10px] text-[#6b4a2b] font-bold uppercase tracking-[0.25em]">Character Profile</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest adnd-chip">
                        {displayUser?.id === campaign?.dmId ? 'Chronicler' : 'Adventurer'}
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 mt-12">
                <div className="adnd-surface rounded-3xl p-8 relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c79c52]/15 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="relative z-10">
                        <div className="flex items-end gap-6 mb-12">
                            <div className="h-24 w-24 rounded-2xl bg-[#e8d3a8] border border-[#3b2a18]/30 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden group">
                                {displayAvatarUrl ? (
                                    <img src={displayAvatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    '👤'
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl adnd-display text-[#2c1d0f] mb-1">
                                    {displayName}
                                </h2>
                                <div className="flex items-center gap-2 text-[#6b4a2b]">
                                    {displaySpecies && (
                                        <span className="text-xs font-bold uppercase tracking-widest">{displaySpecies}</span>
                                    )}
                                    {displaySpecies && displayClass && (
                                        <span className="h-1 w-1 rounded-full bg-[#8a5a2b]"></span>
                                    )}
                                    {displayClass && (
                                        <span className="text-xs font-bold uppercase tracking-widest">{displayClass}</span>
                                    )}
                                    {(displaySpecies || displayClass) && (
                                        <span className="h-1 w-1 rounded-full bg-[#8a5a2b]"></span>
                                    )}
                                    <span className="text-xs font-black text-[#7a4f24] uppercase tracking-widest">Level {displayLevel}</span>
                                </div>
                            </div>
                            {!isTargetingSelf && (
                                <div className="text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest adnd-chip">
                                    Inspecting Member
                                </div>
                            )}
                        </div>

                        <CharacterStats isDM={canEdit} userId={stats?.user} campaignId={campaignId} statsId={statsId} />

                        {/* Renown & Factions Section */}
                        <div className="mt-12 pt-8 border-t adnd-divider">
                            <FactionRenown isDM={canEdit} statsId={statsId} campaignId={campaignId} userId={stats?.user} />
                        </div>

                        {/* Divine Piety Section */}
                        <DivinePiety isDM={canEdit} statsId={statsId} campaignId={campaignId} userId={stats?.user} />
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(`/campaign/${campaignId}`)}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6b4a2b] hover:text-[#2c1d0f] transition-colors"
                    >
                        Return to Map View
                    </button>
                </div>
            </main>
        </div>
    );
}
