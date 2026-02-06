import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '../lib/campaigns';
import { pb } from '../lib/pb';
import HexMapViewer from '../components/HexMapViewer';
import { useAuthStore } from '../store/authStore';
import WorldState from '../components/WorldState';
import type { HexCoord } from '../utils/hexGrid';
import type { CampaignNomination, MapLayer, PBUser, UserStats } from '../types';
import MapAssetManager from '../components/MapAssetManager';
import { characterApi } from '../lib/characterApi';




export default function CampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const currentZ = 0;
  const [partyPosition, setPartyPosition] = useState<{ hexX: number; hexY: number; z: number } | null>(null);
  const [isMapManagerOpen, setIsMapManagerOpen] = useState(false);
  const [viewAsPlayer, setViewAsPlayer] = useState(false);
  const [enteredWorld, setEnteredWorld] = useState(false);
  const queryClient = useQueryClient();

  /* Removed nominationMutation since it was unused */

  const acceptMutation = useMutation({
    mutationFn: (nominationId: string) => campaignApi.acceptNomination(campaignId!, nominationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, 'nominations'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (nominationId: string) => campaignApi.declineNomination(campaignId!, nominationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, 'nominations'] });
    },
  });

  /* Removed handleNominationSubmit since it was unused */

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignApi.getCampaign(campaignId!),
    enabled: !!campaignId,
  });



  const { data: nominations } = useQuery<CampaignNomination[]>({
    queryKey: ['campaign', campaignId, 'nominations'],
    queryFn: () => campaignApi.getCampaignNominations(campaignId!),
    enabled: !!campaignId,
  });

  // Fetch maps/layers from PocketBase (world_state)
  const { data: maps, refetch: refetchMaps } = useQuery<MapLayer[]>({
    queryKey: ['maps', campaignId],
    queryFn: async () => {
      const records = await pb.collection('world_state').getFullList({
        filter: `campaign = "${campaignId}"`,
        sort: '-created',
      });
      return records.map(r => ({
        id: r.id,
        imageUrl: r.map_file ? pb.files.getURL(r, r.map_file) : r.map_url,
        imageWidth: r.image_width || 2000,
        imageHeight: r.image_height || 2000,
        hexSize: typeof r.hex_size === 'number' ? r.hex_size : undefined,
        pixelsPerMile: typeof r.pixels_per_mile === 'number' ? r.pixels_per_mile : undefined,
        milesPerHex: typeof r.miles_per_hex === 'number' ? r.miles_per_hex : undefined,
        hexColumns: r.hex_columns || 50,
        hexRows: r.hex_rows || 50,
        hexOrientation: 'flat',
        createdAt: r.created,
        updatedAt: r.updated,
      }));
    },
    enabled: !!campaignId,
  });

  type UserStatsRecord = UserStats & { expand?: { user?: PBUser } };

  // Fetch all characters (ignore campaign scoping for now)
  const { data: allCharacters, refetch: refetchCharacters } = useQuery<UserStatsRecord[]>({
    queryKey: ['characters', 'all'],
    queryFn: async () => {
      const chars = await characterApi.getAllCharacters();
      return chars || [];
    },
    enabled: true,
  });

  const [creatingChar, setCreatingChar] = useState(false);

  const handleCreateNewCharacter = async () => {
    if (!user || creatingChar) return;

    try {
      setCreatingChar(true);
      if (!campaignId) {
        throw new Error('Missing campaign id.');
      }

      const newChar = await characterApi.createForCampaign(campaignId);
      await refetchCharacters();
      navigate(`/campaign/${campaignId}/stats/${newChar.id}`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const errData = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: Record<string, unknown> }).data
        : undefined;
      console.error('Failed to create character:', error);
      console.error('Error details:', errData);
      alert(`Failed to summon new hero: ${err.message} (${JSON.stringify(errData || {})})`);
    } finally {
      setCreatingChar(false);
    }
  };

  const isRealDM = user?.id === campaign?.dmId;
  const isDM = isRealDM && !viewAsPlayer;

  // Subscribe to Party Position
  useEffect(() => {
    if (!campaignId) return;

    pb.collection('decals').subscribe('*', (e) => {
      if (e.action === 'update' && e.record.site_name === 'party') {
        setPartyPosition({
          hexX: e.record.q,
          hexY: e.record.r,
          z: e.record.z,
        });
      }
    });

    return () => {
      pb.collection('decals').unsubscribe('*');
    };
  }, [campaignId]);

  const handleHexClick = async (hex: HexCoord & { z: number }) => {
    if (!isDM) return;

    try {
      const partyDecal = await pb.collection('decals').getFirstListItem('site_name="party"');
      await pb.collection('decals').update(partyDecal.id, {
        q: hex.q,
        r: hex.r,
        z: hex.z,
      });
    } catch (err: unknown) {
      console.error('Failed to move party:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen adnd-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7a4f24] mx-auto mb-4"></div>
          <p className="adnd-muted">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen adnd-page flex items-center justify-center">
        <div className="text-center">
          <p className="adnd-muted mb-4">Campaign not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary hover:bg-[#4b311a]">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/campaign/${campaignId}/join`;
    navigator.clipboard.writeText(link);
    alert('Invitation link copied to chronicle clipboard!');
  };

  const activeMap = maps?.[0];

  return (
    <div className="min-h-screen adnd-page flex flex-col">
      {/* Header */}
      <header className="h-14 bg-[#e7d3aa]/90 backdrop-blur-sm border-b border-[#3b2a18]/30 flex items-center justify-between px-6 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-[#efe0bf] rounded-lg transition-colors text-[#6b4a2b] hover:text-[#2c1d0f]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm adnd-display text-[#2c1d0f] uppercase tracking-[0.2em] line-clamp-1">{campaign?.name}</h1>
            <p className="text-[10px] adnd-muted font-bold uppercase tracking-widest">
              {viewAsPlayer ? 'Player View' : 'Chronicle Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRealDM && (
            <button
              onClick={() => setViewAsPlayer(!viewAsPlayer)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all flex items-center gap-2 ${viewAsPlayer
                ? 'bg-[#3b2615] text-[#f3e5c5] border-[#7a4f24]'
                : 'bg-[#efe0bf] text-[#6b4a2b] border-[#7a4f24]/60'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {viewAsPlayer ? 'Exit Player View' : 'View as Player'}
            </button>
          )}



          {enteredWorld && (
            <button
              onClick={() => setEnteredWorld(false)}
              className="p-2 hover:bg-[#efe0bf] rounded-lg transition-colors text-[#6b4a2b] hover:text-[#2c1d0f]"
              title="Return to Hub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Viewer or Landing Dashboard */}
        <div className="flex-1 relative overflow-auto">
          {!enteredWorld ? (
            <div className="absolute inset-0 p-8 overflow-y-auto">
              <div className="max-w-4xl w-full adnd-surface rounded-3xl p-10 mx-auto">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Enter World Choice */}
                  <button
                    onClick={() => setEnteredWorld(true)}
                    className="group relative adnd-panel p-8 rounded-2xl transition-all hover:border-[#d8b46c] text-left active:scale-[0.98]"
                  >
                    <div className="mb-4 text-3xl opacity-70 group-hover:opacity-100 transition-opacity">🌍</div>
                    <h3 className="text-lg font-black adnd-ink uppercase tracking-wider mb-2">Enter World Map</h3>
                    <p className="adnd-muted text-xs leading-relaxed">Venture forth into the cartographic realm. (Note: Large maps may take a moment to manifest)</p>
                    <div className="mt-6 flex items-center gap-2 adnd-muted text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Manifest Realm
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>

                  {/* Manage Fellowship Choice */}


                  {/* Character Profile Choice */}
                  <button
                    onClick={() => navigate(`/campaign/${campaignId}/stats`)}
                    className="group relative adnd-panel p-8 rounded-2xl transition-all hover:border-[#d8b46c] text-left active:scale-[0.98]"
                  >
                    <div className="mb-4 text-3xl opacity-70 group-hover:opacity-100 transition-opacity">📜</div>
                    <h3 className="text-lg font-black adnd-ink uppercase tracking-wider mb-2">My Character</h3>
                    <p className="adnd-muted text-xs leading-relaxed">Consult the archives of your deeds, strength, and standing within the factions.</p>
                    <div className="mt-6 flex items-center gap-2 adnd-muted text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Chronicle
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                  {/* Manage Maps (DM Only) */}
                  {isDM && (
                    <button
                      onClick={() => setIsMapManagerOpen(true)}
                      className="group relative adnd-panel p-8 rounded-2xl transition-all hover:border-[#d8b46c] text-left active:scale-[0.98]"
                    >
                      <div className="mb-4 text-3xl opacity-70 group-hover:opacity-100 transition-opacity">🛠️</div>
                      <h3 className="text-lg font-black adnd-ink uppercase tracking-wider mb-2">Manage Cartography</h3>
                      <p className="adnd-muted text-xs leading-relaxed">Modify map assets or purge ancient records.</p>
                      <div className="mt-6 flex items-center gap-2 adnd-muted text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Maps
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  )}

                  {/* World Log Card */}
                  <div className="adnd-box p-8 rounded-2xl text-left md:col-span-2">
                    <div className="mb-4 text-3xl opacity-70">📜</div>
                    <h3 className="text-lg font-black adnd-ink-light uppercase tracking-wider mb-4">World Log</h3>

                    {/* WorldState */}
                    <div className="mb-6">
                      <WorldState campaignId={campaignId || undefined} />
                    </div>

                    {/* D&D Beyond Section - Always rendered for visibility/debug */}
                    <div className="border-t border-[#7a4f24]/40 pt-6 mb-6">
                      <h4 className="text-xs font-black adnd-muted uppercase tracking-widest mb-3">D&D Beyond</h4>

                      {campaign?.dndbeyondLink ? (
                        <a
                          href={campaign.dndbeyondLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 adnd-box rounded-xl p-4 hover:border-[#d8b46c] transition-all group"
                        >
                          <div className="h-10 w-10 rounded-lg bg-[#1b1109] border border-[#7a4f24]/70 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                            🎲
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold adnd-ink-light truncate">Join Campaign on D&D Beyond</p>
                            <p className="text-[10px] adnd-muted-light font-bold uppercase tracking-tighter truncate">{campaign.dndbeyondLink}</p>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        </a>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-[#7a4f24]/30 bg-[#1b1109]/20 text-center">
                          <p className="text-xs adnd-muted italic">No D&D Beyond link linked.</p>
                          {/* Debug info */}
                          <p className="text-[9px] opacity-30 mt-1">Data: {String(campaign?.dndbeyondLink)}</p>
                        </div>
                      )}
                    </div>

                    {/* Nominations */}
                    <div className="border-t border-[#7a4f24]/40 pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black adnd-muted uppercase tracking-widest">Nominations</h4>
                        {isDM && (
                          <button
                            onClick={handleCopyInviteLink}
                            className="text-[10px] bg-[#3b2615] hover:bg-[#4b311a] text-[#f3e5c5] px-2 py-1 rounded border border-[#7a4f24] transition-all font-black uppercase tracking-tighter"
                          >
                            Copy Link
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {nominations?.length ? (
                          nominations.map((nomination) => {
                            const isCurrentNominee = nomination.nominatedPlayerId === user?.id;
                            const canAct = isCurrentNominee && nomination.status === 'PENDING';
                            return (
                              <div
                                key={nomination.id}
                                className="adnd-box rounded-xl p-3 shadow-inner"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-bold adnd-ink-light">
                                      {nomination.nominatedPlayer?.name || nomination.nominatedPlayerId}
                                    </p>
                                    <p className="text-[10px] adnd-muted-light uppercase font-bold tracking-tight">
                                      By {nomination.nominatedBy?.name || nomination.nominatedById}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${nomination.status === 'PENDING'
                                      ? 'bg-[#3b2615] text-[#e7c37a] border-[#7a4f24]'
                                      : 'bg-[#1b1109] text-[#d4bf93] border-[#5c3b1d]'
                                      }`}
                                  >
                                    {nomination.status}
                                  </span>
                                </div>
                                {canAct && (
                                  <div className="flex items-center gap-2 mt-3">
                                    <button
                                      onClick={() => acceptMutation.mutate(nomination.id)}
                                      className="px-3 py-1 bg-[#3b2615] hover:bg-[#4b311a] text-[#f3e5c5] text-[10px] font-black uppercase rounded-lg border border-[#7a4f24] transition-all flex-1"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => declineMutation.mutate(nomination.id)}
                                      className="px-3 py-1 bg-[#6b2a22]/40 hover:bg-[#6b2a22]/60 text-[#f3e5c5] text-[10px] font-black uppercase rounded-lg border border-[#7a4f24] transition-all flex-1"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[10px] adnd-muted italic text-center py-4 adnd-panel rounded-lg border border-dashed border-[#7a4f24]/50">
                            No active nominations.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fellowship Characters */}
                <div className="mt-12 pt-12 border-t adnd-divider">
                  <div className="flex items-center justify-end mb-8">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold adnd-muted uppercase tracking-widest">
                        {allCharacters?.length || 0} Members
                      </span>
                      {isDM && (
                        <button
                          onClick={handleCreateNewCharacter}
                          disabled={creatingChar}
                          className="px-3 py-1.5 bg-[#3b2615] hover:bg-[#4b311a] text-[#f3e5c5] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {creatingChar ? (
                            <>
                              <span className="animate-spin">⚔️</span> Summoning...
                            </>
                          ) : (
                            <>
                              <span>➕</span> Make New Character
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allCharacters?.map((char) => {
                      const avatarUrl = char.expand?.user?.avatar
                        ? pb.files.getURL(char.expand.user, char.expand.user.avatar)
                        : null;
                      return (
                        <button
                          key={char.id}
                          onClick={() => navigate(`/campaign/${campaignId}/stats/${char.id}`)}
                          className="group flex items-center gap-4 adnd-box p-4 rounded-xl transition-all hover:border-[#d8b46c] text-left relative overflow-hidden"
                        >
                          {/* Class Color Strip */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#c79c52] to-[#7a4f24] group-hover:w-1.5 transition-all"></div>

                          <div className="h-10 w-10 rounded-lg bg-[#1b1109] border border-[#7a4f24]/70 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform ml-2">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold adnd-ink-light truncate transition-colors">
                              {char.character_name || "Unnamed Hero"}
                            </p>
                            <p className="text-[10px] adnd-muted-light font-bold uppercase tracking-tighter truncate">
                              Level {Object.values(char.levels || {}).reduce((a, b) => a + b, 0) || 1} {char.class_name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : activeMap ? (
            <HexMapViewer
              map={activeMap}
              currentZ={currentZ}
              partyPosition={partyPosition || undefined}
              isDM={isDM}
              onHexClick={handleHexClick}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-sm px-6">
                <div className="text-4xl mb-4 opacity-30">🗺️</div>
                <h2 className="adnd-muted font-bold uppercase tracking-[0.3em] text-xs mb-2">Unmapped Territory</h2>
                <p className="adnd-muted text-[10px] uppercase font-bold tracking-widest leading-loose">
                  This portion of the realm has not yet been chronicled in the ledger.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Manager Modal */}
      {isMapManagerOpen && (
        <MapAssetManager
          campaignId={campaignId!}
          maps={maps || []}
          onClose={() => setIsMapManagerOpen(false)}
          onRefresh={() => refetchMaps()}
        />
      )}
    </div>
  );
}
