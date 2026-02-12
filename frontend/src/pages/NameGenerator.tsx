import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  NAME_GENERATORS,
  type NameCultureId,
  type NameGender,
  generateBatch,
} from '../utils/nameGenerator';

const clampInt = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, Math.floor(n)));

export default function NameGenerator() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [culture, setCulture] = useState<NameCultureId>('aquilonian');
  const [gender, setGender] = useState<NameGender>('male');
  const [count, setCount] = useState<number>(12);
  const [includeSurname, setIncludeSurname] = useState<boolean>(true);
  const [unique, setUnique] = useState<boolean>(true);
  const [results, setResults] = useState<string[]>([]);

  const active = useMemo(() => NAME_GENERATORS.find((g) => g.id === culture) || NAME_GENERATORS[0], [culture]);

  const handleGenerate = () => {
    const next = generateBatch({
      culture,
      gender,
      includeSurname,
      count,
      unique,
    });
    setResults(next);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      alert('Copy failed. Your browser may be blocking clipboard access.');
    }
  };

  const canGender = active.supportsGender;

  return (
    <div className="min-h-screen adnd-page">
      <nav className="bg-[#e7d3aa]/90 border-b border-[#3b2a18]/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-[#efe0bf] rounded-lg transition-colors text-[#6b4a2b] hover:text-[#2c1d0f]"
                title="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl adnd-display text-[#2c1d0f]">Name Generator</h1>
                <p className="text-[10px] adnd-muted font-bold uppercase tracking-widest">Forge names for heroes and villains</p>
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5">
            <div className="adnd-surface rounded-3xl p-6">
              <h2 className="text-xs font-black adnd-muted uppercase tracking-[0.3em] mb-4">Controls</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-[10px] font-black adnd-muted uppercase tracking-widest mb-2">Culture</div>
                  <select
                    className="input"
                    value={culture}
                    onChange={(e) => setCulture(e.target.value as NameCultureId)}
                  >
                    {NAME_GENERATORS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] adnd-muted mt-2 leading-relaxed">{active.description}</p>
                </label>

                <label className="block">
                  <div className="text-[10px] font-black adnd-muted uppercase tracking-widest mb-2">Gender</div>
                  <select
                    className="input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as NameGender)}
                    disabled={!canGender}
                    title={canGender ? '' : 'This generator is unisex'}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {!canGender && (
                    <p className="text-[10px] adnd-muted mt-2 leading-relaxed">Unisex generator (gender ignored).</p>
                  )}
                </label>

                <label className="block">
                  <div className="text-[10px] font-black adnd-muted uppercase tracking-widest mb-2">Count</div>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(clampInt(Number(e.target.value || 1), 1, 100))}
                  />
                </label>

                <div className="block">
                  <div className="text-[10px] font-black adnd-muted uppercase tracking-widest mb-2">Options</div>
                  <div className="adnd-panel rounded-2xl p-4 space-y-3">
                    <label className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold adnd-ink">Include Surname</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#7a4f24]"
                        checked={includeSurname}
                        onChange={(e) => setIncludeSurname(e.target.checked)}
                        disabled={culture === 'ledger'}
                        title={culture === 'ledger' ? 'Ledger generator already includes surnames' : ''}
                      />
                    </label>
                    <label className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold adnd-ink">Unique Results</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#7a4f24]"
                        checked={unique}
                        onChange={(e) => setUnique(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button onClick={handleGenerate} className="btn btn-primary hover:bg-[#4b311a]">
                  Generate
                </button>
                <button
                  onClick={() => setResults([])}
                  className="btn btn-secondary hover:bg-[#e7d3aa]"
                  disabled={!results.length}
                >
                  Clear
                </button>
                <button
                  onClick={() => copyText(results.join('\n'))}
                  className="btn btn-secondary hover:bg-[#e7d3aa] ml-auto"
                  disabled={!results.length}
                  title="Copy all results to clipboard"
                >
                  Copy All
                </button>
              </div>

              <div className="mt-6 adnd-panel rounded-2xl p-4">
                <p className="text-[10px] adnd-muted font-bold uppercase tracking-widest">Tip</p>
                <p className="text-xs adnd-ink mt-2 leading-relaxed">
                  Click any generated name to copy it.
                </p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7">
            <div className="adnd-surface rounded-3xl p-6">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2 className="text-xs font-black adnd-muted uppercase tracking-[0.3em]">Results</h2>
                <div className="text-[10px] font-black adnd-muted uppercase tracking-widest">
                  {results.length ? `${results.length} name${results.length === 1 ? '' : 's'}` : 'No names yet'}
                </div>
              </div>

              {!results.length ? (
                <div className="adnd-panel rounded-2xl border border-dashed border-[#7a4f24]/60 p-8 text-center">
                  <p className="text-[10px] font-black adnd-muted uppercase tracking-widest">Empty Ledger</p>
                  <p className="text-xs adnd-ink mt-2">Generate a batch to fill this page with fresh names.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1 adnd-scrollbar">
                  {results.map((name, idx) => (
                    <button
                      key={`${name}-${idx}`}
                      type="button"
                      onClick={() => copyText(name)}
                      className="adnd-box rounded-xl p-4 text-left hover:border-[#d8b46c] transition-all active:scale-[0.99]"
                      title="Click to copy"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-black uppercase tracking-wider truncate">{name}</div>
                          <div className="text-[10px] adnd-muted-light font-bold uppercase tracking-widest mt-1 opacity-80">
                            Click to copy
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-xl bg-[#1b1109]/50 border border-[#7a4f24]/50 flex items-center justify-center text-[#d4bf93]">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2v-1h1a2 2 0 002-2V7.414A2 2 0 0015.414 6L13 3.586A2 2 0 0011.586 3H11V4a2 2 0 01-2 2H8V4a2 2 0 00-2-2h2zm3 2V3.5L13.5 6H13a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

