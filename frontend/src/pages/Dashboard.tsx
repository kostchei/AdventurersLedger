import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { campaignApi } from '../lib/campaigns';
import CreateCampaignModal from '../components/CreateCampaignModal';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joiningCampaignId, setJoiningCampaignId] = useState<string | null>(null);

  const { data: memberCampaigns, isLoading: isMemberLoading } = useQuery({
    queryKey: ['campaigns', 'member'],
    queryFn: campaignApi.getUserCampaigns,
  });

  const { data: allCampaigns } = useQuery({
    queryKey: ['campaigns', 'all'],
    queryFn: campaignApi.getAllCampaigns,
  });

  const joinMutation = useMutation({
    mutationFn: campaignApi.joinCampaign,
    onMutate: (campaignId: string) => {
      setJoiningCampaignId(campaignId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'member'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'all'] });
    },
    onSettled: () => {
      setJoiningCampaignId(null);
    },
  });

  const memberIds = new Set(memberCampaigns?.map((campaign) => campaign.id));
  const discoverCampaigns = allCampaigns?.filter(
    (campaign) => !memberIds.has(campaign.id)
  );

  return (
    <div className="min-h-screen adnd-page">
      <nav className="bg-[#e7d3aa]/90 border-b border-[#3b2a18]/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl adnd-display text-[#2c1d0f]">Adventurer's Ledger</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="adnd-ink">{user?.name || user?.email}</span>
              </div>
              <button onClick={logout} className="btn btn-secondary text-sm hover:bg-[#e7d3aa]">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl adnd-display text-[#2c1d0f] mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Adventurer'}!
          </h2>
          <p className="adnd-muted">Choose a campaign or create a new one to get started.</p>
        </div>

        {isMemberLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7a4f24] mx-auto"></div>
            <p className="adnd-muted mt-4">Loading campaigns...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Campaign Card */}
            {/* Create Campaign Card */}
            <button
              onClick={() => {
                if (user?.global_role === 'GM' || user?.global_role === 'ADMIN') {
                  setIsCreateModalOpen(true);
                }
              }}
              className={`card hover:shadow-xl transition-shadow border-2 border-dashed border-[#7a4f24]/60 flex items-center justify-center min-h-[200px] ${user?.global_role === 'GM' || user?.global_role === 'ADMIN'
                ? 'hover:border-[#2c1d0f] cursor-pointer'
                : 'opacity-60 cursor-not-allowed hover:border-[#b44a3a]'
                }`}
              title={
                user?.global_role === 'GM' || user?.global_role === 'ADMIN'
                  ? 'Start a new adventure'
                  : 'You must be a Game Master to create campaigns'
              }
            >
              <div className="text-center">
                <div className="text-5xl mb-3">
                  {user?.global_role === 'GM' || user?.global_role === 'ADMIN' ? '+' : '🔒'}
                </div>
                <h3 className="text-xl font-semibold adnd-ink mb-2">Create Campaign</h3>
                <p className="adnd-muted text-sm">
                  {user?.global_role === 'GM' || user?.global_role === 'ADMIN'
                    ? 'Start a new adventure'
                    : 'GM Access Required'}
                </p>
              </div>
            </button>

            {/* Campaign Cards */}
            {memberCampaigns?.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => navigate(`/campaign/${campaign.id}`)}
                className="card hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold adnd-ink truncate">{campaign.name}</h3>
                  <span
                    className={`px-2 py-1 text-[10px] rounded adnd-chip ${campaign.role === 'DM' ? 'border-[#7a4f24]' : ''}`}
                  >
                    {campaign.role}
                  </span>
                </div>
                {campaign.description && (
                  <p className="adnd-muted text-sm mb-4 line-clamp-2">{campaign.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm adnd-muted">
                  <span>{campaign.role === 'DM' ? 'Dungeon Master' : 'Player'}</span>
                </div>
              </div>
            ))}

            {memberCampaigns?.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="adnd-muted mb-4">No campaigns yet. Create or join one to get started!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {discoverCampaigns && discoverCampaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl adnd-display text-[#2c1d0f]">Discover Campaigns</h2>
            <p className="text-sm adnd-muted">
              Browse playable adventures and request to join.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discoverCampaigns.map((campaign) => (
              <div key={campaign.id} className="card flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold adnd-ink truncate">{campaign.name}</h3>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 adnd-chip rounded-full">
                    Viewer
                  </span>
                </div>
                <p className="text-sm adnd-muted mb-4 line-clamp-3">
                  {campaign.description || 'No description yet.'}
                </p>
                <p className="text-xs adnd-muted mb-6">
                  Hosted by <span className="adnd-ink">{campaign.dmId}</span>
                </p>
                <button
                  onClick={() => joinMutation.mutate(campaign.id)}
                  className="btn btn-primary text-sm mt-auto hover:bg-[#4b311a]"
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending && joiningCampaignId === campaign.id ? 'Joining...' : 'Join Campaign'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
