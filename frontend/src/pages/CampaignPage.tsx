import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '../lib/campaigns';
import { pb } from '../lib/pb';
import HexMapViewer from '../components/HexMapViewer';
import { useFogOfWar } from '../hooks/useFogOfWar';
import { useAuthStore } from '../store/authStore';
import CharacterStats from '../components/CharacterStats';
import WorldState from '../components/WorldState';
import type { HexCoord } from '../utils/hexGrid';

export default function CampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [currentZ, setCurrentZ] = useState(0);
  const { revealedHexes, revealHex } = useFogOfWar();
  const [partyPosition, setPartyPosition] = useState<{ hexX: number; hexY: number; z: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'character' | 'world'>('character');
  const queryClient = useQueryClient();
  const [nomineeId, setNomineeId] = useState('');
  const [keepAccess, setKeepAccess] = useState(true);
  const [nominationMessage, setNominationMessage] = useState('');

  const nominationMutation = useMutation({
    mutationFn: (payload: { playerId: string; keepAccess: boolean; message?: string }) =>
      campaignApi.createNomination({
        campaignId: campaignId!,
        playerId: payload.playerId,
        keepAccess: payload.keepAccess,
        message: payload.message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId, 'nominations'] });
      setNomineeId('');
      setKeepAccess(true);
      setNominationMessage('');
    },
  });

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

  const handleNominationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaignId || !nomineeId) return;
    nominationMutation.mutate({
      playerId: nomineeId,
      keepAccess,
      message: nominationMessage.trim() || undefined,
    });
  };

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignApi.getCampaign(campaignId!),
    enabled: !!campaignId,
  });

  const { data: members } = useQuery({
    queryKey: ['campaign', campaignId, 'members'],
    queryFn: () => campaignApi.getCampaignMembers(campaignId!),
    enabled: !!campaignId,
  });

  const { data: nominations } = useQuery({
    queryKey: ['campaign', campaignId, 'nominations'],
    queryFn: () => campaignApi.getCampaignNominations(campaignId!),
    enabled: !!campaignId,
  });

  // Fetch maps/layers from PocketBase (world_state)
  const { data: maps } = useQuery({
    queryKey: ['maps', campaignId],
    queryFn: async () => {
      const records = await pb.collection('world_state').getFullList({
        sort: 'z_index',
      });
      return records.map(r => ({
        id: r.id,
        imageUrl: r.map_url,
        hexColumns: r.hex_columns || 50,
        hexRows: r.hex_rows || 50,
        imageWidth: r.image_width || 2000,
        imageHeight: r.image_height || 2000,
        hexOrientation: 'flat',
        z: r.z_index,
        createdAt: r.created,
        updatedAt: r.updated,
      }));
    },
    enabled: !!campaignId,
  });

  const isDM = user?.id === campaign?.dmId;

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

      await revealHex(hex.q, hex.r, hex.z);
    } catch (err) {
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

  const activeMap = maps?.find((m: any) => m.z === currentZ) || maps?.[0];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center h-16 shadow-lg z-20">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold">{campaign.name}</h1>
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${isDM ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-blue-500/20 text-blue-500 border border-blue-500/50'}`}>
            {isDM ? 'DUNGEON MASTER' : 'PLAYER'}
          </span>
        </div>

        {/* Layer Switcher */}
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          {maps?.map((m: any) => (
            <button
              key={m.z}
              onClick={() => setCurrentZ(m.z)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currentZ === m.z ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
            >
              L{m.z}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Viewer */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {activeMap ? (
            <HexMapViewer
              map={activeMap}
              currentZ={currentZ}
              revealedHexes={revealedHexes}
              partyPosition={partyPosition || undefined}
              isDM={isDM}
              onHexClick={handleHexClick}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 italic mb-4">No map data found for this layer.</p>
                {isDM && (
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors">
                    Upload Layer Asset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-84 bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl z-10">
          <div className="flex border-b border-gray-800 bg-gray-950/50">
            <button
              onClick={() => setActiveTab('character')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'character' ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Character
            </button>
            <button
              onClick={() => setActiveTab('world')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'world' ? 'text-primary-400 border-b-2 border-primary-500 bg-primary-500/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              World
            </button>
          </div>

            <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {activeTab === 'character' ? (
                <>
                  <section>
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Current Vitality</h3>
                    <CharacterStats />
                  </section>

                  <section>
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Coordinates</h3>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-800">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Party Location</span>
                        <span className="text-primary-400 font-mono">
                          {partyPosition ? `${partyPosition.hexX}, ${partyPosition.hexY} (Z:${partyPosition.z})` : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Party Members</h3>
                    <div className="space-y-3">
                      {members?.length ? (
                        members.map((member) => (
                          <div
                            key={member.id}
                            className="bg-gray-800/40 border border-gray-800 rounded-lg p-3 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {member.user?.name || member.userId}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {member.user?.email || `ID: ${member.userId}`}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${member.isPrimaryDM ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-blue-500/10 text-blue-300 border border-blue-500/40'}`}
                              >
                                {member.isPrimaryDM ? 'DM' : member.role}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500">
                              Status: {member.status}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No members yet.</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Nomination Center</h3>
                    {campaign?.role === 'DM' && (
                      <form onSubmit={handleNominationSubmit} className="space-y-3 bg-gray-800/50 border border-gray-800 rounded-lg p-4">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                          Nominate a player
                        </label>
                        <select
                          value={nomineeId}
                          onChange={(event) => setNomineeId(event.target.value)}
                          className="input bg-gray-900 text-sm"
                        >
                          <option value="">Select a player</option>
                          {members
                            ?.filter((member) => member.userId !== campaign?.dmId)
                            .map((member) => (
                              <option key={member.id} value={member.userId}>
                                {member.user?.name || member.userId}
                              </option>
                            ))}
                        </select>

                        <label className="flex items-center gap-2 text-xs text-gray-400">
                          <input
                            type="checkbox"
                            checked={keepAccess}
                            onChange={(event) => setKeepAccess(event.target.checked)}
                            className="form-checkbox"
                          />
                          Keep access to GM controls after handoff
                        </label>

                        <textarea
                          value={nominationMessage}
                          onChange={(event) => setNominationMessage(event.target.value)}
                          placeholder="Optional note for the nominee"
                          className="input min-h-[80px] text-sm"
                        />

                        <button
                          type="submit"
                          className="btn btn-primary w-full text-sm"
                          disabled={nominationMutation.isPending || !nomineeId}
                        >
                          {nominationMutation.isPending ? 'Sending...' : 'Nominate Player'}
                        </button>
                      </form>
                    )}

                    <div className="space-y-3 mt-4">
                      {nominations?.length ? (
                        nominations.map((nomination) => {
                          const isCurrentNominee = nomination.nominatedPlayerId === user?.id;
                          const canAct = isCurrentNominee && nomination.status === 'PENDING';
                          return (
                            <div
                              key={nomination.id}
                              className="bg-gray-800/50 border border-gray-800 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {nomination.nominatedPlayer?.name || nomination.nominatedPlayerId}
                                  </p>
                                  <p className="text-[11px] text-gray-500">
                                    Proposed by {nomination.nominatedBy?.name || nomination.nominatedById}
                                  </p>
                                </div>
                                <span
                                  className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    nomination.status === 'PENDING'
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40'
                                      : 'bg-gray-800/80 text-gray-200 border border-gray-700'
                                  }`}
                                >
                                  {nomination.status}
                                </span>
                              </div>
                              {nomination.message && (
                                <p className="text-xs text-gray-400 mt-2 line-clamp-3">
                                  {nomination.message}
                                </p>
                              )}

                              {canAct && (
                                <div className="flex items-center gap-2 mt-3">
                                  <button
                                    onClick={() => acceptMutation.mutate(nomination.id)}
                                    className="btn btn-success text-xs flex-1"
                                    disabled={acceptMutation.isPending}
                                  >
                                    {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                                  </button>
                                  <button
                                    onClick={() => declineMutation.mutate(nomination.id)}
                                    className="btn btn-secondary text-xs flex-1"
                                    disabled={declineMutation.isPending}
                                  >
                                    {declineMutation.isPending ? 'Declining...' : 'Decline'}
                                  </button>
                                </div>
                              )}

                              <p className="text-xs text-gray-500 mt-2">
                                Keep access: {nomination.keepAccess ? 'Yes' : 'No'}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No pending nominations.</p>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <WorldState />
              )}
            </div>
        </aside>
      </div>
    </div>
  );
}
