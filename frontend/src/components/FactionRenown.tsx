import { useState } from 'react';
import { useCharacterStats } from '../hooks/useCharacterStats';
import { useCampaignConfig } from '../hooks/useCampaignConfig';
import { getRankForScore } from '../lib/campaignConfig';

interface FactionRenownProps {
  isDM: boolean;
  statsId?: string;
  campaignId?: string;
  userId?: string;
}

export default function FactionRenown({ isDM, statsId, campaignId, userId }: FactionRenownProps) {
  const { stats, updateFactionRenown } = useCharacterStats(statsId, campaignId, userId);
  const { data: config } = useCampaignConfig(campaignId);
  const [showRanks, setShowRanks] = useState(false);

  if (!stats) return null;

  const factionsConfig = config?.factions || [];
  const renownRanks = config?.renownRanks || [];

  const factions = stats.factions || {};

  const handleUpdate = (faction: string, amount: number) => {
    const current = factions[faction] || 0;
    updateFactionRenown(faction, Math.max(0, current + amount));
  };

  const sorted = [...factionsConfig].sort((a, b) => {
    const renownA = factions[a] || 0;
    const renownB = factions[b] || 0;
    if (renownA !== renownB) return renownB - renownA;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black adnd-muted uppercase tracking-[0.2em] mb-0">Active Allegiances</h3>
        <button
          onClick={() => setShowRanks((v) => !v)}
          className="text-[9px] font-black text-[#6b4a2b] uppercase tracking-widest hover:text-[#2c1d0f] transition-colors"
        >
          {showRanks ? 'Hide Ranks' : 'Ranks'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 adnd-scrollbar">
        {sorted.map((faction) => {
          const renown = factions[faction] || 0;
          const rank = getRankForScore(renownRanks, renown);

          return (
            <div
              key={faction}
              className={`p-4 rounded-2xl border transition-all ${
                renown > 0
                  ? 'adnd-box border-[#7a4f24] shadow-lg shadow-[#2a1b10]/30'
                  : 'adnd-box-soft border-[#5c3b1d] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black adnd-ink-light uppercase tracking-wider truncate mb-0.5">{faction}</p>
                  <p className={`text-[8px] font-bold uppercase tracking-widest ${rank.colorClass || 'text-[#8a6a43]'}`}>{rank.title}</p>
                  {rank.description && <p className="text-[10px] adnd-muted-light mt-1 leading-relaxed opacity-70">{rank.description}</p>}
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

      {showRanks && (
        <div className="adnd-box rounded-3xl p-6">
          <h4 className="text-[10px] font-black adnd-muted uppercase tracking-[0.2em] mb-4">Renown Rank Ladder</h4>
          <div className="space-y-2">
            {renownRanks.map((band) => (
              <div key={band.min} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={`text-[10px] font-black uppercase tracking-wider ${band.colorClass || 'text-[#8a6a43]'}`}>{band.title}</div>
                  {band.description && <div className="text-[10px] adnd-muted-light leading-relaxed opacity-80">{band.description}</div>}
                </div>
                <div className="text-[10px] font-black text-[#6b4a2b] font-mono whitespace-nowrap">{band.min}+</div>
              </div>
            ))}
          </div>
          <p className="text-[9px] adnd-muted italic text-center mt-5">Ranks are campaign-configurable.</p>
        </div>
      )}

      <p className="text-[10px] adnd-muted italic text-center px-4 leading-relaxed mt-4">
        Renown thresholds and titles can vary by campaign. Ask your DM what each rank unlocks.
      </p>
    </div>
  );
}

