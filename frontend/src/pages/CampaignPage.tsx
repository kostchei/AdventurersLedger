import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '../lib/campaigns';
import { pb } from '../lib/pb';
import HexMapViewer from '../components/HexMapViewer';
import { useAuthStore } from '../store/authStore';
import WorldState from '../components/WorldState';
import type { HexCoord } from '../utils/hexGrid';
import type { CampaignNomination, MapLayer, UserStats } from '../types';




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

  // Fetch all characters including those not in membership (NPCs etc)
  const { data: allCharacters, refetch: refetchCharacters } = useQuery<UserStats[]>({
    queryKey: ['campaign', campaignId, 'characters'],
    queryFn: async () => {
      const chars = await characterApi.getAllCharacters();
      return chars || [];
    },
    enabled: !!campaignId,
  });

  const [creatingChar, setCreatingChar] = useState(false);

  const handleCreateNewCharacter = async () => {
    if (!user || creatingChar) return;

    try {
      setCreatingChar(true);
      const newChar = await characterApi.create({
        user: user.id, // Assign to current user (likely GM) initially
        character_name: "Unnamed Hero",
        class_name: "Commoner",
        species: "Human",
        background: "None",
        hp: 10,
        max_hp: 10,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        xp: 0,
        gold: 0,
        conditions: [],
        factions: {},
        piety_deity: null,
        piety_score: 0,
        levels: {},
        spells: [],
        feats: [],
        bastion: [],
        inventory: []
      });
      await refetchCharacters();
      navigate(`/campaign/${campaignId}/stats/${newChar.user}`);
    } catch (error) {
      console.error('Failed to create character:', error);
      alert('Failed to summon new hero.');
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Campaign not found</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-primary-600 text-white rounded">
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] line-clamp-1">{campaign?.name}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {viewAsPlayer ? 'Player View' : 'Chronicle Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRealDM && (
            <button
              onClick={() => setViewAsPlayer(!viewAsPlayer)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all flex items-center gap-2 ${viewAsPlayer
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-white/10'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              {viewAsPlayer ? 'Exit Player View' : 'View as Player'}
            </button>
          )}

          <button
            onClick={() => navigate(`/campaign/${campaignId}/stats`)}
            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Character Profile
          </button>
          {isDM && (
            <button
              onClick={() => setIsMapManagerOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              Manage Maps
            </button>
          )}

          {enteredWorld && (
            <button
              onClick={() => setEnteredWorld(false)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
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
        <div className="flex-1 relative overflow-auto bg-slate-950">
          {!enteredWorld ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-y-auto">
              <div className="max-w-4xl w-full py-12">
                <div className="text-center mb-12">
                  <div className="inline-block p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-[0.4em] mb-4">Mission Control</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Select your next stage of adventure</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Enter World Choice */}
                  <button
                    onClick={() => setEnteredWorld(true)}
                    className="group relative bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:bg-slate-800/80 transition-all hover:border-indigo-500/30 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] text-left active:scale-[0.98]"
                  >
                    <div className="mb-4 text-3xl opacity-50 group-hover:opacity-100 transition-opacity">🌍</div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Enter World Map</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">Venture forth into the cartographic realm. (Note: Large maps may take a moment to manifest)</p>
                    <div className="mt-6 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className="group relative bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:bg-slate-800/80 transition-all hover:border-indigo-500/30 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] text-left active:scale-[0.98]"
                  >
                    <div className="mb-4 text-3xl opacity-50 group-hover:opacity-100 transition-opacity">📜</div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">My Character</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">Consult the archives of your deeds, strength, and standing within the factions.</p>
                    <div className="mt-6 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
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
                      className="group relative bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:bg-slate-800/80 transition-all hover:border-amber-500/30 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] text-left active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="mb-4 text-3xl opacity-50 group-hover:opacity-100 transition-opacity">🛠️</div>
                          <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Manage Cartography</h3>
                          <p className="text-slate-500 text-xs leading-relaxed">Modify map assets or purge ancient records.</p>
                        </div>
                        <div className="text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/30 px-3 py-1 rounded-full group-hover:bg-amber-500/10 transition-colors">
                          DM Tools
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Unified Fellowship Management */}
                <div className="mt-12 pt-12 border-t border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
                      {isDM ? 'Manage the Fellowship' : 'The Fellowship'}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        {allCharacters?.length || 0} Members Present
                      </span>
                      {isDM && (
                        <button
                          onClick={handleCreateNewCharacter}
                          disabled={creatingChar}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    {allCharacters?.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => navigate(`/campaign/${campaignId}/stats/${char.user}`)}
                        className="group flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-all hover:border-indigo-500/30 text-left relative overflow-hidden"
                      >
                        {/* Class Color Strip */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 group-hover:w-1.5 transition-all"></div>

                        <div className="h-10 w-10 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform ml-2">
                          {/* @ts-ignore - expand type not fully propagated */}
                          {char.expand?.user?.avatarUrl ? (
                            /* @ts-ignore */
                            <img src={char.expand.user.avatarUrl} alt="" className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                            {char.character_name || "Unnamed Hero"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter truncate">
                            Level {Object.values(char.levels || {}).reduce((a, b) => a + b, 0) || 1} {char.class_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-12 text-center opacity-40">
                  <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em] italic">
                    "The Ledger tracks all, but the journey is yours to define."
                  </p>
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
                <div className="text-4xl mb-4 opacity-20">🗺️</div>
                <h2 className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs mb-2">Unmapped Territory</h2>
                <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest leading-loose">
                  This portion of the realm has not yet been chronicled in the ledger.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-84 bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl z-10">
          <div className="px-6 py-4 border-b border-white/5 bg-slate-950/50">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">World Log</h3>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
            <section>
              <WorldState campaignId={campaignId || undefined} />
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Nominations</h3>
                {isDM && (
                  <button
                    onClick={handleCopyInviteLink}
                    className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30 transition-all font-black uppercase tracking-tighter"
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
                        className="bg-slate-800/40 border border-white/5 rounded-xl p-3 shadow-inner"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-white">
                              {nomination.nominatedPlayer?.name || nomination.nominatedPlayerId}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                              By {nomination.nominatedBy?.name || nomination.nominatedById}
                            </p>
                          </div>
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${nomination.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-white/5'
                              }`}
                          >
                            {nomination.status}
                          </span>
                        </div>
                        {canAct && (
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => acceptMutation.mutate(nomination.id)}
                              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/30 transition-all flex-1"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => declineMutation.mutate(nomination.id)}
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-black uppercase rounded-lg border border-red-500/30 transition-all flex-1"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-slate-600 italic text-center py-4 bg-slate-900/20 rounded-lg border border-dashed border-slate-800">
                    No active nominations.
                  </p>
                )}
              </div>
            </section>
          </div>
        </aside>
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
