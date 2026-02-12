import { useState } from 'react';
import { useCharacterStats } from '../hooks/useCharacterStats';
import { useCampaignConfig } from '../hooks/useCampaignConfig';
import { getRankForScore, type Deity } from '../lib/campaignConfig';

interface DivinePietyProps {
  isDM: boolean;
  statsId?: string;
  campaignId?: string;
  userId?: string;
}

export default function DivinePiety({ isDM, statsId, campaignId, userId }: DivinePietyProps) {
  const { stats, selectDeity, updatePiety } = useCharacterStats(statsId, campaignId, userId);
  const { data: config } = useCampaignConfig(campaignId);

  const [isSelecting, setIsSelecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRanks, setShowRanks] = useState(false);

  if (!stats) return null;

  const deities: Deity[] = config?.deities || [];
  const pietyRanks = config?.pietyRanks || [];

  const activeDeityName = stats.piety_deity;
  const activeDeity = deities.find((d) => d.name === activeDeityName);
  const pietyScore = stats.piety_score || 0;
  const rank = getRankForScore(pietyRanks, pietyScore);

  const filteredDeities = deities.filter((d) => {
    const haystack = `${d.name} ${d.domain || ''}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const handleDeitySelect = (name: string) => {
    selectDeity(name || null);
    setIsSelecting(false);
    setSearchTerm('');
  };

  const handlePietyUpdate = (amount: number) => {
    if (!activeDeityName) return;
    updatePiety(Math.max(0, pietyScore + amount));
  };

  return (
    <div className="mt-12 pt-8 border-t adnd-divider space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black adnd-muted uppercase tracking-[0.2em]">Divine Piety</h3>
        <div className="flex items-center gap-3">
          {!isSelecting && (
            <button
              onClick={() => setIsSelecting(true)}
              className="text-[9px] font-black text-[#7a4f24] uppercase tracking-widest hover:text-[#2c1d0f] transition-colors"
            >
              {activeDeityName ? 'Change Deity' : 'Select Deity'}
            </button>
          )}
          <button
            onClick={() => setShowRanks((v) => !v)}
            className="text-[9px] font-black text-[#6b4a2b] uppercase tracking-widest hover:text-[#2c1d0f] transition-colors"
          >
            {showRanks ? 'Hide Ranks' : 'Ranks'}
          </button>
        </div>
      </div>

      {isSelecting ? (
        <div className="adnd-box rounded-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <input
              autoFocus
              type="text"
              placeholder="Search the heavens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-sm font-bold adnd-ink-light placeholder:text-[#a48256] focus:outline-none w-full"
            />
            <button onClick={() => setIsSelecting(false)} className="text-[#c9a361] hover:text-[#f3e5c5]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto adnd-scrollbar pr-2">
            {filteredDeities.map((deity) => (
              <button
                key={deity.name}
                onClick={() => handleDeitySelect(deity.name)}
                className="text-left p-3 rounded-xl bg-[#1b1109] border border-[#5c3b1d] hover:border-[#d8b46c] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black adnd-ink-light uppercase tracking-wider group-hover:text-[#e7c37a] transition-colors">
                    {deity.name}
                  </span>
                  {deity.domain && (
                    <span className="text-[9px] font-bold adnd-muted-light uppercase tracking-tighter">{deity.domain}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : activeDeity ? (
        <div className="p-6 adnd-box rounded-3xl border border-[#7a4f24] shadow-xl shadow-[#2a1b10]/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#c79c52]/15 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>

          <div className="relative flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xl font-black adnd-ink-light tracking-tight">{activeDeity.name}</h4>
                {activeDeity.domain && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[#c9a361]"></span>
                    <span className="text-[10px] font-bold adnd-muted-light uppercase tracking-[0.2em]">{activeDeity.domain}</span>
                  </>
                )}
              </div>

              <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${rank.colorClass || 'text-[#a48256]'} mb-1`}>
                {rank.title}
              </p>
              {rank.description && <p className="text-[10px] adnd-muted-light leading-relaxed opacity-80">{rank.description}</p>}

              <div className="flex flex-wrap gap-x-4 gap-y-1 opacity-50 mt-3">
                {activeDeity.plane && (
                  <span className="text-[9px] font-bold adnd-muted-light uppercase tracking-widest leading-none">
                    Plane: {activeDeity.plane}
                  </span>
                )}
                {activeDeity.worshipers && (
                  <span className="text-[9px] font-bold adnd-muted-light uppercase tracking-widest leading-none truncate">
                    Worshipers: {activeDeity.worshipers}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-black text-[#e7c37a] font-mono tracking-tighter leading-none mb-1">{pietyScore}</div>
              <div className="text-[9px] font-black adnd-muted-light uppercase tracking-widest leading-none">Piety</div>
            </div>
          </div>

          {isDM && (
            <div className="mt-6 pt-4 border-t border-[#5c3b1d]/60 flex items-center justify-center gap-6">
              <button
                onClick={() => handlePietyUpdate(-1)}
                className="h-8 w-8 rounded-xl bg-[#1b1109] border border-[#7a4f24]/70 flex items-center justify-center text-[#d4bf93] hover:text-[#f3e5c5] hover:bg-[#6b2a22] transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-[10px] font-black adnd-muted-light uppercase tracking-widest">Adjust Piety</span>
              <button
                onClick={() => handlePietyUpdate(1)}
                className="h-8 w-8 rounded-xl bg-[#1b1109] border border-[#7a4f24]/70 flex items-center justify-center text-[#d4bf93] hover:text-[#f3e5c5] hover:bg-[#3b3a22] transition-all font-bold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsSelecting(true)}
          className="w-full p-8 adnd-panel rounded-3xl border border-dashed border-[#7a4f24]/70 flex flex-col items-center justify-center gap-3 group hover:border-[#2c1d0f] transition-all"
        >
          <div className="h-10 w-10 rounded-full bg-[#efe0bf] flex items-center justify-center text-[#6b4a2b] group-hover:text-[#2c1d0f] transition-all">
            *
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black adnd-muted uppercase tracking-[0.2em] group-hover:text-[#2c1d0f] transition-colors">
              Undevoted Journey
            </p>
            <p className="text-[9px] font-bold adnd-muted uppercase tracking-widest mt-1">
              Select a deity to begin your divine path
            </p>
          </div>
        </button>
      )}

      {showRanks && (
        <div className="adnd-box rounded-3xl p-6">
          <h4 className="text-[10px] font-black adnd-muted uppercase tracking-[0.2em] mb-4">Piety Rank Ladder</h4>
          <div className="space-y-2">
            {pietyRanks.map((band) => (
              <div key={band.min} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={`text-[10px] font-black uppercase tracking-wider ${band.colorClass || 'text-[#a48256]'}`}>{band.title}</div>
                  {band.description && <div className="text-[10px] adnd-muted-light leading-relaxed opacity-80">{band.description}</div>}
                </div>
                <div className="text-[10px] font-black text-[#6b4a2b] font-mono whitespace-nowrap">{band.min}+</div>
              </div>
            ))}
          </div>
          <p className="text-[9px] adnd-muted italic text-center mt-5">Ranks are campaign-configurable.</p>
        </div>
      )}
    </div>
  );
}

