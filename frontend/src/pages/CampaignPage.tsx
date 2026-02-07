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
import CampaignLogsTab from '../components/CampaignLogsTab';




export default function CampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const currentZ = 0;
  const [partyPosition, setPartyPosition] = useState<{ hexX: number; hexY: number; z: number } | null>(null);
  const [isMapManagerOpen, setIsMapManagerOpen] = useState(false);
  const [viewAsPlayer, setViewAsPlayer] = useState(false);
  const [enteredWorld, setEnteredWorld] = useState(false);
  const [activeHubTab, setActiveHubTab] = useState<'overview' | 'logs'>('overview');
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

  // Fetch all characters for this campaign
  const { data: allCharacters, refetch: refetchCharacters } = useQuery<UserStatsRecord[]>({
    queryKey: ['characters', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const chars = await characterApi.getByCampaign(campaignId);
      return chars || [];
    },
    enabled: !!campaignId,
  });

  const [creatingChar, setCreatingChar] = useState(false);
  const [myCharacterListOpen, setMyCharacterListOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserStatsRecord | null>(null);
  const [deletingChar, setDeletingChar] = useState(false);

  const handleCreateNewCharacter = async () => {
    if (!user || creatingChar) return;

    try {
      setCreatingChar(true);
      if (!campaignId) {
        throw new Error('Missing campaign id.');
      }

      const newChar = await characterApi.createForCampaign(campaignId);
      await refetchCharacters();
      setMyCharacterListOpen(false);
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
  const isCampaignGM = Boolean(isRealDM || user?.global_role === 'GM' || user?.global_role === 'ADMIN');
  // Always scope to the opened campaign in the UI, even if the backend filter is unavailable.
  // Legacy: characters created before the `campaign` field existed will have no campaign value.
  // In that case:
  // - Campaign GM: show them (can't reliably assign; treat as unscoped).
  // - Players: show only their own unscoped characters.
  const campaignScoped = (allCharacters || []).filter((c) => {
    if (!campaignId) return true;
    const camp = (c as unknown as { campaign?: string | null }).campaign;
    if (typeof camp === 'string' && camp.trim() !== '') {
      return camp === campaignId;
    }
    if (isCampaignGM) return true;
    return Boolean(user && c.user === user.id);
  });
  const myCharacters = user ? campaignScoped.filter((c) => c.user === user.id) : [];
  const visibleCharacters = isCampaignGM ? campaignScoped : myCharacters;

  const handleOpenCharacter = (statsId: string) => {
    if (!campaignId) return;
    setMyCharacterListOpen(false);
    navigate(`/campaign/${campaignId}/stats/${statsId}`);
  };

  const canDeleteCharacter = (char: UserStatsRecord): boolean => {
    if (!user) return false;
    return isCampaignGM || char.user === user.id;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!campaignId) return;

    try {
      setDeletingChar(true);
      await characterApi.delete(deleteTarget.id);
      await refetchCharacters();
      setDeleteTarget(null);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Failed to delete character:', error);
      alert(`Failed to delete character: ${err.message}`);
    } finally {
      setDeletingChar(false);
    }
  };

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

                <div className="mb-6 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('overview')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${activeHubTab === 'overview'
                      ? 'bg-[#3b2615] text-[#f3e5c5] border-[#7a4f24]'
                      : 'bg-[#efe0bf] text-[#6b4a2b] border-[#7a4f24]/60'
                      }`}
                  >
                    Campaign Hub
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('logs')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${activeHubTab === 'logs'
                      ? 'bg-[#3b2615] text-[#f3e5c5] border-[#7a4f24]'
                      : 'bg-[#efe0bf] text-[#6b4a2b] border-[#7a4f24]/60'
                      }`}
                  >
                    Campaign Logs
                  </button>
                </div>

                {activeHubTab === 'logs' && (
                  <div className="mb-6">
                    <CampaignLogsTab campaignId={campaignId!} userId={user?.id} />
                  </div>
                )}

                {activeHubTab === 'overview' && (
                  <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Enter World Choice */}
                  <button
                    onClick={() => setEnteredWorld(true)}
                    className="group relative adnd-box p-5 rounded-xl transition-all hover:border-[#d8b46c] text-left active:scale-[0.98]"
                  >
                    <div className="mb-3 text-2xl opacity-70 group-hover:opacity-100 transition-opacity">🌍</div>
                    <h3 className="text-base font-black adnd-ink-light uppercase tracking-wider mb-2">Enter World Map</h3>
                    <p className="adnd-muted-light text-xs leading-relaxed">Venture forth into the cartographic realm. (Note: Large maps may take a moment to manifest)</p>
                    <div className="mt-4 flex items-center gap-2 adnd-muted-light text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Manifest Realm
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>

                  {/* Manage Fellowship Choice */}


                  {/* Character Profile Choice */}
                  <button
                    onClick={() => setMyCharacterListOpen(true)}
                    className="group relative adnd-box p-5 rounded-xl transition-all hover:border-[#d8b46c] text-left active:scale-[0.98]"
                  >
                    <div className="mb-3 text-2xl opacity-70 group-hover:opacity-100 transition-opacity">📜</div>
                    <h3 className="text-base font-black adnd-ink-light uppercase tracking-wider mb-2">My Character</h3>
                    <p className="adnd-muted-light text-xs leading-relaxed">Consult the archives of your deeds, strength, and standing within the factions.</p>
                    <div className="mt-4 flex items-center gap-2 adnd-muted-light text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      {myCharacters.length ? `${myCharacters.length} Chronicle${myCharacters.length === 1 ? '' : 's'}` : 'Open Chronicle'}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                  {/* Manage Maps (DM Only) */}
                  {isDM && (
                    <button
                      onClick={() => setIsMapManagerOpen(true)}
                      className="group relative adnd-box p-5 rounded-xl transition-all hover:border-[#d8b46c] text-left active:scale-[0.98]"
                    >
                      <div className="mb-3 text-2xl opacity-70 group-hover:opacity-100 transition-opacity">🛠️</div>
                      <h3 className="text-base font-black adnd-ink-light uppercase tracking-wider mb-2">Manage Cartography</h3>
                      <p className="adnd-muted-light text-xs leading-relaxed">Modify map assets or purge ancient records.</p>
                      <div className="mt-4 flex items-center gap-2 adnd-muted-light text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Maps
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  )}

                  {/* World Log Card */}
                  <div className="adnd-box p-5 rounded-xl text-left md:col-span-2">
                    <div className="mb-3 text-2xl opacity-70">📜</div>
                    <h3 className="text-base font-black adnd-ink-light uppercase tracking-wider mb-4">World Log</h3>

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
                      {visibleCharacters.length} {isCampaignGM ? 'Characters' : 'Chronicles'}
                    </span>
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleCharacters.map((char) => {
                      const avatarUrl = char.expand?.user?.avatar
                        ? pb.files.getURL(char.expand.user, char.expand.user.avatar)
                        : null;
                      const ownerName = char.expand?.user?.name || char.expand?.user?.username || null;
                      return (
                        <div
                          key={char.id}
                          onClick={() => navigate(`/campaign/${campaignId}/stats/${char.id}`)}
                          className="group flex items-center gap-4 adnd-box p-4 rounded-xl transition-all hover:border-[#d8b46c] text-left relative overflow-hidden cursor-pointer"
                        >
                          {/* Class Color Strip */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#c79c52] to-[#7a4f24] group-hover:w-1.5 transition-all"></div>

                          {canDeleteCharacter(char) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(char);
                              }}
                              className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-[#1b1109]/60 border border-[#7a4f24]/50 flex items-center justify-center text-[#d4bf93] hover:text-[#f3e5c5] hover:bg-[#6b2a22]/70 transition-all"
                              title="Delete character"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h1v10a2 2 0 002 2h6a2 2 0 002-2V6h1a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 6a1 1 0 012 0v7a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}

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
                            {isCampaignGM && ownerName && (
                              <p className="text-[9px] adnd-muted-light font-bold uppercase tracking-widest truncate mt-1 opacity-70">
                                {ownerName}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                  </>
                )}
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

      {/* My Characters Modal */}
      {myCharacterListOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg adnd-surface rounded-2xl border border-[#7a4f24]/50 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="p-5 border-b adnd-divider flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black adnd-ink-light uppercase tracking-[0.25em]">
                  {isCampaignGM ? 'Campaign Characters' : 'My Characters'}
                </h3>
                <p className="text-[10px] adnd-muted-light font-bold uppercase tracking-widest mt-1">
                  {campaign?.name || 'Campaign'} chronicles tied to your account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMyCharacterListOpen(false)}
                className="h-9 w-9 rounded-xl bg-[#1b1109]/40 border border-[#7a4f24]/50 text-[#d4bf93] hover:text-[#f3e5c5] hover:bg-[#1b1109]/70 transition-all flex items-center justify-center"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-5">
                      {(isCampaignGM ? visibleCharacters : myCharacters).length ? (
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 adnd-scrollbar">
                  {(isCampaignGM ? visibleCharacters : myCharacters).map((char) => {
                    const level = Object.values(char.levels || {}).reduce((a, b) => a + b, 0) || 1;
                    const ownerName = char.expand?.user?.name || char.expand?.user?.username || null;
                    return (
                      <div
                        key={char.id}
                        onClick={() => handleOpenCharacter(char.id)}
                        className="adnd-box rounded-xl p-4 border border-[#7a4f24]/50 hover:border-[#d8b46c] transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black adnd-ink-light uppercase tracking-wider truncate">
                            {char.character_name || 'Unnamed Hero'}
                          </p>
                          <p className="text-[10px] adnd-muted-light font-bold uppercase tracking-widest truncate mt-1">
                            Level {level} {char.class_name || 'Commoner'}
                          </p>
                          {isCampaignGM && ownerName && (
                            <p className="text-[9px] adnd-muted-light font-bold uppercase tracking-widest truncate mt-1 opacity-70">
                              {ownerName}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {canDeleteCharacter(char) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(char);
                              }}
                              className="h-9 w-9 rounded-xl bg-[#1b1109]/40 border border-[#7a4f24]/50 text-[#d4bf93] hover:text-[#f3e5c5] hover:bg-[#6b2a22]/60 transition-all flex items-center justify-center"
                              title="Delete character"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h1v10a2 2 0 002 2h6a2 2 0 002-2V6h1a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 6a1 1 0 012 0v7a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          <div className="h-9 w-9 rounded-xl bg-[#1b1109]/40 border border-[#7a4f24]/50 text-[#d4bf93] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="adnd-panel rounded-2xl border border-dashed border-[#7a4f24]/60 p-6 text-center">
                  <p className="text-[10px] font-black adnd-muted uppercase tracking-widest">No characters yet</p>
                  <p className="text-[10px] adnd-muted-light mt-2 leading-relaxed">
                    Create a new character to begin your chronicle for this campaign.
                  </p>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMyCharacterListOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#7a4f24]/60 bg-[#1b1109]/20 text-[#d4bf93] text-[10px] font-black uppercase tracking-widest hover:bg-[#1b1109]/40 transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewCharacter}
                  disabled={creatingChar}
                  className="px-4 py-2 rounded-xl border border-[#7a4f24]/60 bg-[#efe0bf] text-[#2c1d0f] text-[10px] font-black uppercase tracking-widest hover:bg-[#e7d3aa] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creatingChar ? 'Summoning...' : 'Create New'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Character Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md adnd-surface rounded-2xl border border-[#7a4f24]/50 shadow-2xl shadow-black/40 p-6">
            <h3 className="text-xs font-black adnd-ink-light uppercase tracking-[0.25em]">Delete Character</h3>
            <p className="text-[10px] adnd-muted-light font-bold uppercase tracking-widest mt-2">
              This cannot be undone.
            </p>
            <div className="mt-4 adnd-box rounded-xl p-4 border border-[#7a4f24]/50">
              <p className="text-xs font-black adnd-ink-light uppercase tracking-wider truncate">
                {deleteTarget.character_name || 'Unnamed Hero'}
              </p>
              <p className="text-[10px] adnd-muted-light font-bold uppercase tracking-widest truncate mt-1">
                {deleteTarget.class_name || 'Commoner'}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingChar}
                className="px-4 py-2 rounded-xl border border-[#7a4f24]/60 bg-[#1b1109]/20 text-[#d4bf93] text-[10px] font-black uppercase tracking-widest hover:bg-[#1b1109]/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingChar}
                className="px-4 py-2 rounded-xl border border-[#7a4f24]/60 bg-[#6b2a22]/70 text-[#f3e5c5] text-[10px] font-black uppercase tracking-widest hover:bg-[#6b2a22] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingChar ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
