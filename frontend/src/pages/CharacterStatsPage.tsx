import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { campaignApi } from '../lib/campaigns';
import { pb } from '../lib/pb';
import CharacterStats from '../components/CharacterStats';
import FactionRenown from '../components/FactionRenown';
import DivinePiety from '../components/DivinePiety';
import { useAuthStore } from '../store/authStore';

export default function CharacterStatsPage() {
    const { campaignId, statsId } = useParams<{ campaignId: string; statsId?: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    // Fetch character stats to find out which user it belongs to
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['stats', statsId],
        queryFn: async () => {
            if (!statsId) return null;
            return pb.collection('users_stats').getOne(statsId, {
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

    const { data: campaign, isLoading: isCampaignLoading } = useQuery({
        queryKey: ['campaign', campaignId],
        queryFn: () => campaignApi.getCampaign(campaignId!),
        enabled: !!campaignId,
    });

    const isDM = currentUser?.id === campaign?.dmId;
    const isTargetingSelf = stats ? stats.user === currentUser?.id : true;
    const totalLevel = stats?.levels
        ? Object.values(stats.levels).reduce((sum, value) => sum + value, 0)
        : 0;
    const displayLevel = totalLevel > 0 ? totalLevel : 1;
    const displayName = stats?.character_name || displayUser?.name || 'Adventurer';
    const displaySpecies = stats?.species || null;
    const displayClass = stats?.class_name || null;

    if (isCampaignLoading || isStatsLoading || (targetUserId && targetUserId !== currentUser?.id && isUserLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 pb-12">
            {/* Header */}
            <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/campaign/${campaignId}`)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em]">{campaign?.name}</h1>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Character Profile</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                        {displayUser?.id === campaign?.dmId ? 'Chronicler' : 'Adventurer'}
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 mt-12">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="relative z-10">
                        <div className="flex items-end gap-6 mb-12">
                            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden group">
                                {displayUser?.avatarUrl ? (
                                    <img src={displayUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    '👤'
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-black tracking-tight text-white mb-1">
                                    {displayName}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {displaySpecies && (
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{displaySpecies}</span>
                                    )}
                                    {displaySpecies && displayClass && (
                                        <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                    )}
                                    {displayClass && (
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{displayClass}</span>
                                    )}
                                    {(displaySpecies || displayClass) && (
                                        <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                                    )}
                                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Level {displayLevel}</span>
                                </div>
                            </div>
                            {!isTargetingSelf && (
                                <div className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                    Inspecting Member
                                </div>
                            )}
                        </div>

                        <CharacterStats isDM={isDM} userId={stats?.user} campaignId={campaignId} statsId={statsId} />

                        {/* Renown & Factions Section */}
                        <div className="mt-12 pt-8 border-t border-white/5">
                            <FactionRenown isDM={isDM} />
                        </div>

                        {/* Divine Piety Section */}
                        <DivinePiety isDM={isDM} />
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(`/campaign/${campaignId}`)}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                        Return to Map View
                    </button>
                </div>
            </main>
        </div>
    );
}
