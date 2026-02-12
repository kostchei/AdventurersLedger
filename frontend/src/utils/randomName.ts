import type { CampaignConfig } from '../lib/campaignConfig';

type NameParts = { first: string[]; last: string[] };

const defaultParts: NameParts = {
  first: [
    'Alden', 'Briar', 'Cael', 'Dain', 'Elara', 'Fen', 'Galen', 'Hest', 'Iris', 'Joren',
    'Kael', 'Liora', 'Mira', 'Nash', 'Orin', 'Perrin', 'Quinn', 'Rowan', 'Sera', 'Thane',
  ],
  last: [
    'Ashford', 'Blackbriar', 'Brightwood', 'Duskryn', 'Emberfall', 'Frostmantle', 'Glimmer', 'Hawthorne',
    'Ironwood', 'Kestrel', 'Lightfoot', 'Moonbrook', 'Nightwind', 'Oakenshield', 'Ravencrest', 'Stormborn',
    'Thornfield', 'Underbough', 'Windrivver', 'Wyrmward',
  ],
};

// Exported for reuse in tools (e.g. name generator page).
export const DEFAULT_NAME_PARTS: Readonly<NameParts> = defaultParts;

const pick = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)] || '';

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((s) => s.trim()) : [];

const tryGetPartsFromConfig = (nameGenerator: unknown, species?: string): NameParts | null => {
  if (typeof nameGenerator !== 'object' || nameGenerator === null || Array.isArray(nameGenerator)) return null;
  const ng = nameGenerator as Record<string, unknown>;

  const getParts = (obj: unknown): NameParts | null => {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return null;
    const r = obj as Record<string, unknown>;
    const first = asStringArray(r.first);
    const last = asStringArray(r.last);
    if (!first.length && !last.length) return null;
    return { first: first.length ? first : defaultParts.first, last: last.length ? last : defaultParts.last };
  };

  // Supported shape (optional):
  // {
  //   default: { first: [...], last: [...] },
  //   bySpecies: { Human: { first: [...], last: [...] }, Elf: { ... } }
  // }
  const bySpecies = typeof ng.bySpecies === 'object' && ng.bySpecies !== null ? (ng.bySpecies as Record<string, unknown>) : null;
  if (species && bySpecies && Object.prototype.hasOwnProperty.call(bySpecies, species)) {
    const candidate = getParts(bySpecies[species]);
    if (candidate) return candidate;
  }

  const def = getParts(ng.default);
  if (def) return def;

  return null;
};

export const generateRandomName = (config?: Pick<CampaignConfig, 'nameGenerator'>, species?: string): string => {
  const parts = tryGetPartsFromConfig(config?.nameGenerator, species) || defaultParts;
  return `${pick(parts.first)} ${pick(parts.last)}`.trim();
};
