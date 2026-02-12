import type { CampaignRecord } from '../types/pocketbase';

export interface Deity {
  name: string;
  domain?: string;
  worshipers?: string;
  plane?: string;
}

export interface RankBand {
  min: number;
  title: string;
  description?: string;
  colorClass?: string;
}

export interface CampaignConfig {
  speciesOptions: string[];
  backgroundOptions: string[];
  classOptions: string[];
  subclassOptions: Record<string, string[]>;
  deities: Deity[];
  factions: string[];
  pietyRanks: RankBand[];
  renownRanks: RankBand[];
  nameGenerator?: unknown;
}

const asStringArray = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((s) => s.trim());
};

const asDeities = (v: unknown): Deity[] => {
  if (!Array.isArray(v)) return [];
  const out: Deity[] = [];
  for (const item of v) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) out.push({ name });
      continue;
    }
    if (typeof item === 'object' && item !== null) {
      const r = item as Record<string, unknown>;
      const name = typeof r.name === 'string' ? r.name.trim() : '';
      if (!name) continue;
      out.push({
        name,
        domain: typeof r.domain === 'string' ? r.domain : undefined,
        worshipers: typeof r.worshipers === 'string' ? r.worshipers : undefined,
        plane: typeof r.plane === 'string' ? r.plane : undefined,
      });
    }
  }
  return out;
};

const asFactions = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) out.push(name);
      continue;
    }
    if (typeof item === 'object' && item !== null) {
      const r = item as Record<string, unknown>;
      const name = typeof r.name === 'string' ? r.name.trim() : '';
      if (name) out.push(name);
    }
  }
  return out;
};

const asSubclassOptions = (v: unknown): Record<string, string[]> => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
  const r = v as Record<string, unknown>;
  const out: Record<string, string[]> = {};
  for (const [klass, arr] of Object.entries(r)) {
    const key = String(klass).trim();
    if (!key) continue;
    const values = asStringArray(arr);
    if (values.length) out[key] = values;
  }
  return out;
};

const asRanks = (v: unknown): RankBand[] => {
  if (!Array.isArray(v)) return [];
  const out: RankBand[] = [];
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const min = typeof r.min === 'number' && Number.isFinite(r.min) ? r.min : null;
    const title = typeof r.title === 'string' ? r.title.trim() : '';
    if (min === null || !title) continue;
    out.push({
      min,
      title,
      description: typeof r.description === 'string' ? r.description : undefined,
      colorClass: typeof r.colorClass === 'string' ? r.colorClass : undefined,
    });
  }
  // Sort descending by min so "first match wins".
  return out.sort((a, b) => b.min - a.min);
};

export const defaultCampaignConfig = (): CampaignConfig => ({
  speciesOptions: [
    'Human',
    'Dwarf',
    'Elf',
    'Gnome',
    'Halfling',
    'Half-Elf',
    'Half-Orc',
    'Dragonborn',
    'Tiefling',
  ],
  backgroundOptions: [
    'Acolyte',
    'Criminal',
    'Folk Hero',
    'Noble',
    'Sage',
    'Soldier',
    'Urchin',
    'Hermit',
    'Outlander',
    'Entertainer',
  ],
  classOptions: [
    'Barbarian',
    'Bard',
    'Cleric',
    'Druid',
    'Fighter',
    'Monk',
    'Paladin',
    'Ranger',
    'Rogue',
    'Sorcerer',
    'Warlock',
    'Wizard',
  ],
  subclassOptions: {},
  // Defaults are Faerun-ish; campaigns can override with `campaigns.deities`.
  deities: [
    { name: 'Amaunator', domain: 'Sun', plane: 'Mechanus', worshipers: 'Farmers, lawmakers, travelers' },
    { name: 'Asmodeus', domain: 'Indulgence', plane: 'The Nine Hells (Nessus)', worshipers: 'Corrupt politicians, desperate folk' },
    { name: 'Auril', domain: 'Winter', plane: 'Pandemonium (Pandesmos)', worshipers: 'Druids, inhabitants of cold climates' },
    { name: 'Azuth', domain: 'Wizardry', plane: 'Arcadia (Buxenus)', worshipers: 'Arcane spellcasters' },
    { name: 'Bane', domain: 'Tyranny', plane: 'Acheron (Avalas)', worshipers: 'Conquerors, Fighters, Monks, tyrants' },
    { name: 'Chauntea', domain: 'Agriculture', plane: 'Elysium (Eronia)', worshipers: 'Farmers, gardeners, homesteaders' },
    { name: 'Helm', domain: 'Watchfulness', plane: 'Mechanus', worshipers: 'Explorers, Fighters, guards, Paladins' },
    { name: 'Ilmater', domain: 'Endurance', plane: 'Bytopia (Shurrock)', worshipers: 'Monks, the oppressed, the poor' },
    { name: 'Kelemvor', domain: 'Dead', plane: 'Astral Plane (Fugue Plane)', worshipers: 'Funeral workers, the dying' },
    { name: 'Lathander', domain: 'Dawn and renewal', plane: 'Elysium (Eronia)', worshipers: 'Aristocrats, athletes, merchants, youths' },
    { name: 'Mystra', domain: 'Magic', plane: 'Elysium (Eronia)', worshipers: 'Anyone who uses magic' },
    { name: 'Oghma', domain: 'Knowledge', plane: 'The Outlands', worshipers: 'Archivists, cartographers, sages' },
    { name: 'Selune', domain: 'Moon', plane: 'Ysgard', worshipers: 'Sailors, wanderers, spellcasters' },
    { name: 'Shar', domain: 'Darkness and loss', plane: 'Hades', worshipers: 'Those suffering pain or loss' },
    { name: 'Tempus', domain: 'War', plane: 'Limbo', worshipers: 'Fighters, mercenaries, warriors' },
    { name: 'Tyr', domain: 'Justice', plane: 'Mount Celestia (Lunia)', worshipers: 'Judges, law enforcers, lawyers, Paladins' },
    { name: 'Umberlee', domain: 'Sea', plane: 'The Abyss', worshipers: 'Coastal dwellers, sailors' },
  ],
  factions: [
    "Cult of the Dragon",
    "Emerald Enclave",
    "Harpers",
    "Lords' Alliance",
    "Order of the Gauntlet",
    "Red Wizards",
    "Zhentarim",
  ],
  // Default rank ladders are intentionally lightweight and configurable per campaign.
  pietyRanks: [
    { min: 50, title: 'Champion', description: 'A living exemplar of your deity.', colorClass: 'text-[#e7c37a]' },
    { min: 25, title: 'Disciple', description: 'Trusted and empowered in service.', colorClass: 'text-[#d4bf93]' },
    { min: 10, title: 'Votary', description: 'Recognized devotion and growing favor.', colorClass: 'text-[#c9a361]' },
    { min: 3, title: 'Devotee', description: 'Faithful practice; the first signs of notice.', colorClass: 'text-[#b68a50]' },
    { min: 0, title: 'Follower', description: 'A beginning path of faith.', colorClass: 'text-[#a48256]' },
  ],
  renownRanks: [
    { min: 50, title: 'Exalted', description: 'A legendary figure in the organization.', colorClass: 'text-[#e7c37a]' },
    { min: 40, title: 'Commander', description: 'Trusted to lead major operations.', colorClass: 'text-[#d4bf93]' },
    { min: 30, title: 'Leader', description: 'Respected authority and influence.', colorClass: 'text-[#c9a361]' },
    { min: 25, title: 'Veteran', description: 'Proven agent with established reputation.', colorClass: 'text-[#b68a50]' },
    { min: 15, title: 'Senior Agent', description: 'Reliable and known across the region.', colorClass: 'text-[#d4bf93]' },
    { min: 10, title: 'Agent', description: 'Officially recognized member.', colorClass: 'text-[#c9b087]' },
    { min: 5, title: 'Operative', description: 'Useful contact with growing trust.', colorClass: 'text-[#b5986a]' },
    { min: 3, title: 'Associate', description: 'Occasional collaborator.', colorClass: 'text-[#a48256]' },
    { min: 0, title: 'Stranger', description: 'No standing or influence yet.', colorClass: 'text-[#8a6a43]' },
  ],
});

export const buildCampaignConfig = (campaign?: CampaignRecord | null): CampaignConfig => {
  const base = defaultCampaignConfig();
  if (!campaign) return base;

  const speciesOptions = asStringArray(campaign.species_options);
  const backgroundOptions = asStringArray(campaign.background_options);
  const classOptions = asStringArray(campaign.class_options);
  const subclassOptions = asSubclassOptions(campaign.subclass_options);
  const deities = asDeities(campaign.deities);
  const factions = asFactions(campaign.factions);
  const pietyRanks = asRanks(campaign.piety_ranks);
  const renownRanks = asRanks(campaign.renown_ranks);

  return {
    ...base,
    speciesOptions: speciesOptions.length ? speciesOptions : base.speciesOptions,
    backgroundOptions: backgroundOptions.length ? backgroundOptions : base.backgroundOptions,
    classOptions: classOptions.length ? classOptions : base.classOptions,
    subclassOptions: Object.keys(subclassOptions).length ? subclassOptions : base.subclassOptions,
    deities: deities.length ? deities : base.deities,
    factions: factions.length ? factions : base.factions,
    pietyRanks: pietyRanks.length ? pietyRanks : base.pietyRanks,
    renownRanks: renownRanks.length ? renownRanks : base.renownRanks,
    nameGenerator: campaign.name_generator ?? base.nameGenerator,
  };
};

export const getRankForScore = (bands: RankBand[], score: number): RankBand => {
  for (const band of bands) {
    if (score >= band.min) return band;
  }
  // Should never happen if bands includes a 0-min entry.
  return { min: 0, title: 'Unranked' };
};

