import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  PROFICIENCY_LEVELS,
  PROFICIENCY_OPTIONS_BY_TYPE,
  PROFICIENCY_TYPE_LABEL,
  SKILL_SYNONYMS,
  type ProficiencyLevel,
  type ProficiencyType,
} from '../../constants/proficiencies';

type ProficienciesBuckets = Record<ProficiencyType, Record<string, ProficiencyLevel>>;

const EMPTY_PROFS: ProficienciesBuckets = {
  skills: {},
  tools: {},
  kits: {},
  instruments: {},
  gaming_sets: {},
};

function normalizeKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u2019\u2018`]/g, "'")
    .replace(/\s+/g, ' ');
}

function normalizeLevel(value: unknown): ProficiencyLevel {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'none' || v === 'half' || v === 'full' || v === 'expertise') return v;
  if (v === 'proficient') return 'full';
  return 'none';
}

function cloneEmpty(): ProficienciesBuckets {
  return { skills: {}, tools: {}, kits: {}, instruments: {}, gaming_sets: {} };
}

function canonizeName(type: ProficiencyType, raw: string): string {
  const name = String(raw || '').trim();
  if (!name) return '';

  const key = normalizeKey(name);

  if (type === 'skills') {
    const syn = SKILL_SYNONYMS[key];
    if (syn) return syn;
  }

  const options = PROFICIENCY_OPTIONS_BY_TYPE[type] || [];
  const match = options.find((opt) => normalizeKey(opt) === key);
  return match || name;
}

function normalizeProficiencies(raw: unknown): ProficienciesBuckets {
  if (!raw) return cloneEmpty();

  const out = cloneEmpty();

  if (Array.isArray(raw)) {
    // [{type:'skills', name:'Acrobatics', level:'full'}]
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const anyEntry = entry as Record<string, unknown>;
      const typeRaw = String(anyEntry.type || anyEntry.category || anyEntry.kind || '').trim().toLowerCase();
      const nameRaw = String(anyEntry.name || anyEntry.title || anyEntry.skill || anyEntry.tool || '').trim();
      const levelRaw = anyEntry.level ?? anyEntry.proficiency ?? anyEntry.value;
      if (!nameRaw) continue;

      let bucket: ProficiencyType = 'skills';
      if (typeRaw.includes('skill')) bucket = 'skills';
      else if (typeRaw.includes('instrument')) bucket = 'instruments';
      else if (typeRaw.includes('gaming')) bucket = 'gaming_sets';
      else if (typeRaw.includes('kit')) bucket = 'kits';
      else if (typeRaw.includes('tool')) bucket = 'tools';

      const name = canonizeName(bucket, nameRaw);
      const level = normalizeLevel(levelRaw);
      if (level !== 'none') out[bucket][name] = level;
    }
    return out;
  }

  if (typeof raw === 'object') {
    const asObj = raw as Record<string, unknown>;

    const hasBuckets =
      (asObj.skills && typeof asObj.skills === 'object') ||
      (asObj.tools && typeof asObj.tools === 'object') ||
      (asObj.kits && typeof asObj.kits === 'object') ||
      (asObj.instruments && typeof asObj.instruments === 'object') ||
      (asObj.gaming_sets && typeof asObj.gaming_sets === 'object') ||
      (asObj.gamingSets && typeof asObj.gamingSets === 'object');

    if (hasBuckets) {
      const buckets: Array<[unknown, ProficiencyType]> = [
        [asObj.skills, 'skills'],
        [asObj.tools, 'tools'],
        [asObj.kits, 'kits'],
        [asObj.instruments, 'instruments'],
        [asObj.gaming_sets ?? asObj.gamingSets, 'gaming_sets'],
      ];

      for (const [value, bucket] of buckets) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
        for (const [nameRaw, levelRaw] of Object.entries(value as Record<string, unknown>)) {
          const name = canonizeName(bucket, nameRaw);
          const level = normalizeLevel(levelRaw);
          if (!name || level === 'none') continue;
          out[bucket][name] = level;
        }
      }

      return out;
    }

    // Legacy flat map -> treat as skills.
    for (const [nameRaw, levelRaw] of Object.entries(asObj)) {
      const name = canonizeName('skills', nameRaw);
      const level = normalizeLevel(levelRaw);
      if (!name || level === 'none') continue;
      out.skills[name] = level;
    }
  }

  return out;
}

function pruneForSave(profs: ProficienciesBuckets): ProficienciesBuckets {
  const out = cloneEmpty();
  (Object.keys(EMPTY_PROFS) as ProficiencyType[]).forEach((type) => {
    const bucket = profs[type];
    for (const [name, level] of Object.entries(bucket || {})) {
      const n = String(name || '').trim();
      const lvl = normalizeLevel(level);
      if (!n || lvl === 'none') continue;
      out[type][n] = lvl;
    }
  });
  return out;
}

function sortedEntries(profs: ProficienciesBuckets): Array<{ type: ProficiencyType; name: string; level: ProficiencyLevel }> {
  const rows: Array<{ type: ProficiencyType; name: string; level: ProficiencyLevel }> = [];
  (Object.keys(EMPTY_PROFS) as ProficiencyType[]).forEach((type) => {
    const bucket = profs[type] || {};
    Object.keys(bucket)
      .sort((a, b) => a.localeCompare(b))
      .forEach((name) => rows.push({ type, name, level: bucket[name] }));
  });
  return rows;
}

export default function ProficiencyEditor({
  value,
  isDM,
  onUpdate,
}: {
  value: unknown;
  isDM: boolean;
  onUpdate: (next: unknown) => Promise<unknown> | void;
}) {
  const [draft, setDraft] = useState<ProficienciesBuckets>(() => normalizeProficiencies(value));
  const [type, setType] = useState<ProficiencyType>('skills');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ProficiencyLevel>('full');

  useEffect(() => {
    setDraft(normalizeProficiencies(value));
  }, [value]);

  const rows = useMemo(() => sortedEntries(draft), [draft]);
  const hasAny = rows.length > 0;

  const options = PROFICIENCY_OPTIONS_BY_TYPE[type] || [];

  // Hide completely if not DM and empty (matching existing editors).
  if (!isDM && !hasAny) return null;

  const commit = (next: ProficienciesBuckets) => {
    setDraft(next);
    try {
      const payload = pruneForSave(next);
      Promise.resolve(onUpdate(payload)).catch((e) => {
        console.error('Failed to save proficiencies:', e);
      });
    } catch (e) {
      console.error('Failed to update proficiencies:', e);
    }
  };

  const setOne = (t: ProficiencyType, rawName: string, rawLevel: ProficiencyLevel) => {
    const canon = canonizeName(t, rawName);
    if (!canon) return;

    const next = { ...draft, [t]: { ...(draft[t] || {}) } } as ProficienciesBuckets;
    const lvl = normalizeLevel(rawLevel);
    if (lvl === 'none') {
      delete next[t][canon];
    } else {
      next[t][canon] = lvl;
    }
    commit(next);
  };

  const removeOne = (t: ProficiencyType, entryName: string) => setOne(t, entryName, 'none');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setOne(type, trimmed, level || 'full');
    setName('');
    setLevel('full');
  };

  return (
    <section className="adnd-box rounded-xl p-4">
      <h3 className="text-[10px] font-black adnd-muted-light uppercase tracking-widest mb-3 leading-none">
        Proficiencies
      </h3>

      {hasAny ? (
        <div className="space-y-2 mb-4">
          {rows.map((r) => (
            <div
              key={`${r.type}:${r.name}`}
              className="flex items-center gap-2 justify-between adnd-box-soft rounded-xl p-3 border border-[#6b4a2b]/40"
            >
              <div className="min-w-0">
                <div className="text-[9px] font-black adnd-muted uppercase tracking-widest leading-none">
                  {PROFICIENCY_TYPE_LABEL[r.type]}
                </div>
                <div className="text-sm font-bold adnd-ink-light truncate">{r.name}</div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={r.level}
                  onChange={(e) => setOne(r.type, r.name, e.target.value as ProficiencyLevel)}
                  disabled={!isDM}
                  className="adnd-input-dark rounded px-2 py-1 text-xs focus:outline-none focus:border-[#d8b46c]"
                  title="Proficiency level"
                >
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>

                {isDM && (
                  <button
                    type="button"
                    onClick={() => removeOne(r.type, r.name)}
                    className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#6b2a22] hover:text-[#2c1d0f] transition-colors"
                    title="Remove (sets to none)"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] adnd-muted-light italic py-1 mb-3">None recorded</p>
      )}

      {isDM && (
        <div className="grid grid-cols-1 gap-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={type}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value as ProficiencyType)}
              className="adnd-input-dark rounded px-2 py-1 text-xs focus:outline-none focus:border-[#d8b46c]"
            >
              {(Object.keys(PROFICIENCY_OPTIONS_BY_TYPE) as ProficiencyType[]).map((t) => (
                <option key={t} value={t}>
                  {PROFICIENCY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>

            <select
              value={level}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setLevel(e.target.value as ProficiencyLevel)}
              className="adnd-input-dark rounded px-2 py-1 text-xs focus:outline-none focus:border-[#d8b46c]"
              title="Default is full when adding"
            >
              {PROFICIENCY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                list="proficiency-options"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Add ${PROFICIENCY_TYPE_LABEL[type].toLowerCase()}... (defaults to full)`}
                className="w-full adnd-input-dark rounded px-2 py-1 text-sm focus:outline-none focus:border-[#d8b46c]"
              />
              <datalist id="proficiency-options">
                {options.map((opt) => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="px-3 py-1 bg-[#3b2615] hover:bg-[#4b311a] text-[#f3e5c5] text-xs font-bold rounded border border-[#7a4f24] transition-all"
            >
              ADD
            </button>
          </div>

          <p className="text-[10px] adnd-muted-light leading-relaxed">
            Missing entries imply <span className="font-black">none</span>. Adding sets <span className="font-black">full</span> by
            default.
          </p>
        </div>
      )}
    </section>
  );
}
