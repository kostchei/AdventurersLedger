import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignApi } from '../lib/campaigns';

export default function JoinCampaign() {
    const { campaignId } = useParams<{ campaignId: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(true);

    useEffect(() => {
        const join = async () => {
            if (!campaignId) return;
            try {
                await campaignApi.joinCampaign(campaignId);
                // Small delay for thematic effect
                setTimeout(() => {
                    navigate(`/campaign/${campaignId}`);
                }, 1500);
            } catch (err: unknown) {
                console.error('Failed to join campaign:', err);
                setError(err instanceof Error ? err.message : 'The realm portal failed to stabilize. Ensure the invite is still valid.');
                setIsJoining(false);
            }
        };

        join();
    }, [campaignId, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center adnd-page relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c79c52]/15 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6b4a2b]/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-md w-full mx-4 text-center">
                {isJoining ? (
                    <div className="space-y-6">
                        <div className="relative inline-block">
                            <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-[#7a4f24] animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">🔮</div>
                        </div>
                        <h1 className="text-2xl adnd-display text-[#2c1d0f] tracking-tight">Stabilizing Realm Portal...</h1>
                        <p className="adnd-muted font-medium italic">Joining the chronicle as an adventurer.</p>
                    </div>
                ) : (
                    <div className="adnd-surface rounded-3xl p-8 shadow-2xl">
                        <div className="text-5xl mb-6">🌋</div>
                        <h1 className="text-2xl adnd-display text-[#2c1d0f] mb-4">Portal Collapse</h1>
                        <p className="adnd-muted mb-8">{error}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full btn btn-primary py-3 px-4 rounded-xl transition-all hover:bg-[#4b311a]"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
