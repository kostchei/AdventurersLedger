export type ProficiencyLevel = 'none' | 'half' | 'full' | 'expertise';

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = ['none', 'half', 'full', 'expertise'];

export type ProficiencyType = 'skills' | 'tools' | 'kits' | 'instruments' | 'gaming_sets';

export const PROFICIENCY_TYPE_LABEL: Record<ProficiencyType, string> = {
  skills: 'Skill',
  tools: 'Tool',
  kits: 'Kit',
  instruments: 'Musical Instrument',
  gaming_sets: 'Gaming Set',
};

export const SKILLS: string[] = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival',
];

export const TOOLS: string[] = [
  "Alchemist's Supplies",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Smith's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
  "Navigator's Tools",
  "Thieves' Tools",
];

export const KITS: string[] = ["Disguise Kit", "Forgery Kit", "Healer's Kit", "Herbalism Kit", "Poisoner's Kit"];

export const GAMING_SETS: string[] = ['Dice Set', 'Dragonchess Set', 'Playing Card Set', 'Three-Dragon Ante Set'];

export const MUSICAL_INSTRUMENTS: string[] = [
  'Bagpipes',
  'Drum',
  'Dulcimer',
  'Flute',
  'Horn',
  'Lute',
  'Lyre',
  'Pan Flute',
  'Shawm',
  'Viol',
];

export const PROFICIENCY_OPTIONS_BY_TYPE: Record<ProficiencyType, string[]> = {
  skills: SKILLS,
  tools: TOOLS,
  kits: KITS,
  instruments: MUSICAL_INSTRUMENTS,
  gaming_sets: GAMING_SETS,
};

export const SKILL_SYNONYMS: Record<string, string> = {
  // Common typo compatibility.
  'slight of hand': 'Sleight of Hand',
  'sleight of hand': 'Sleight of Hand',
};

