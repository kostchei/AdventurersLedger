import { DEFAULT_NAME_PARTS, generateRandomName } from './randomName';

export type NameGender = 'male' | 'female';

export type NameCultureId =
  | 'ledger'
  | 'aquilonian'
  | 'barbarian'
  | 'lusitania'
  | 'oriental'
  | 'qharan';

export type NameGeneratorDescriptor = {
  id: NameCultureId;
  label: string;
  description: string;
  supportsGender: boolean;
};

export const NAME_GENERATORS: readonly NameGeneratorDescriptor[] = [
  {
    id: 'ledger',
    label: "Ledger (Generic)",
    description: 'Two-part fantasy names (first + surname).',
    supportsGender: false,
  },
  {
    id: 'aquilonian',
    label: 'Aquilonian',
    description: 'Arthurian / chivalric fantasy vibe.',
    supportsGender: true,
  },
  {
    id: 'barbarian',
    label: 'Barbarian',
    description: 'Harsh northern / sword-and-sorcery vibe.',
    supportsGender: true,
  },
  {
    id: 'lusitania',
    label: 'Lusitania',
    description: 'Iberian / Venetian-inspired vibe.',
    supportsGender: true,
  },
  {
    id: 'oriental',
    label: 'Oriental',
    description: 'East Asian inspired syllables + presets.',
    supportsGender: true,
  },
  {
    id: 'qharan',
    label: "Q'haran",
    description: 'Desert-mystic inspired names + titles.',
    supportsGender: true,
  },
] as const;

const pick = (arr: readonly string[]): string => arr[Math.floor(Math.random() * arr.length)] || '';

const capitalize = (s: string): string =>
  s.length ? `${s.charAt(0).toUpperCase()}${s.slice(1)}` : s;

const titleCaseFirst = (s: string): string =>
  s.length ? `${s.charAt(0).toUpperCase()}${s.slice(1).toLowerCase()}` : s;

const normalizeSpace = (s: string): string => s.replace(/\s+/g, ' ').trim();

// --- Aquilonian (ported from /d:/code/pleb/nameGenerators/aquilonianNames.js) ---
const AQUILONIAN = {
  maleStart: ['Ar', 'Ca', 'Mer', 'Mor', 'Per', 'Lan', 'Vi', 'Ig', 'Ka'],
  maleMid: ['bel', 'cal', 'gal', 'mor', 'tar', 'uth', 'win', 'nor'],
  maleEnd: ['gon', 'loc', 'lon', 'din', 'der', 'lan', 'thur', 'gaw'],

  femaleStart: ['An', 'Mor', 'Gua', 'Hel', 'Is', 'Ela', 'Vi', 'Gly', 'Ca'],
  femaleMid: ['a', 'e', 'i', 'o', 'ia', 'ora', 'ella', 'lyn', 'thea'],
  femaleEnd: ['wen', 'lin', 'vyr', 'min', 'sir', 'lott', 'ryn', 'dell'],

  arthurianMaleNames: [
    'Lancelot', 'Gawain', 'Percival', 'Galahad', 'Kay', 'Bedivere', 'Tristan',
    'Gaheris', 'Gareth', 'Lamorak', 'Bors', 'Lionel', 'Agravain', 'Palamedes',
    'Safir', 'Ector', 'Calogrenant', 'Uther', 'Lot', 'Mark', 'Pellinore', 'Ban',
    'Caradoc', 'Gorlois', 'Uriens', 'Merlin', 'Yvain', 'Sagramore', 'Brunor',
    'Dinadan', 'Morien', 'Pelleas', 'Tor', 'Meliant', 'Brandiles', 'Dagonet',
    'Culhwch', 'Goreu', 'Cei', 'Menw', 'Geraint', 'Owain', 'Accolon',
    'Louen', 'Calard', 'Tancred', 'Bohemond', 'Gaston', 'Cassyon', 'Reynard',
    'Childebert', 'Thierulf', 'Adalhard', 'Theoderic', 'Arthur', 'Segwarides',
    'Claudas', 'Helias', 'Maugantius', 'Pellam', 'Drystan', 'Esclabor',
  ],
  arthurianFemaleNames: [
    'Guinevere', 'Morgan', 'Morgause', 'Igraine', 'Elaine', 'Lynette',
    'Lyonesse', 'Isolde', 'Nimue', 'Viviane', 'Enide', 'Laudine', 'Lunete',
    'Blanchefleur', 'Ragnell', 'Clarissant', 'Hellawes', 'Sebile', 'Angharad',
    'Amalberga', 'Bertilde', 'Chlotilde', 'Fastrada', 'Ermengarde', 'Richilde',
    'Repanse', 'Olwen', 'Ganieda', 'Blasine', 'Ninianne', 'Rotrud',
  ],
} as const;

const generateAquilonian = (gender: NameGender): string => {
  if (Math.random() >= 0.5) {
    const list = gender === 'male' ? AQUILONIAN.arthurianMaleNames : AQUILONIAN.arthurianFemaleNames;
    return pick(list);
  }

  const syllableCount = Math.random() < 0.5 ? 2 : 3;
  const syllables: string[] = [];

  if (gender === 'male') {
    syllables.push(pick(AQUILONIAN.maleStart));
    if (syllableCount === 3) syllables.push(pick(AQUILONIAN.maleMid));
    syllables.push(pick(AQUILONIAN.maleEnd));
  } else {
    syllables.push(pick(AQUILONIAN.femaleStart));
    if (syllableCount === 3) syllables.push(pick(AQUILONIAN.femaleMid));
    syllables.push(pick(AQUILONIAN.femaleEnd));
  }

  return capitalize(syllables.join(''));
};

// --- Barbarian (ported from /d:/code/pleb/nameGenerators/barbarianNames.js) ---
const BARBARIAN = {
  nm1: ['ae', 'au', 'ei', 'a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u'],
  nm2: ['', '', '', 'b', 'bl', 'br', 'bh', 'd', 'dr', 'dh', 'f', 'fr', 'g', 'gh', 'gr', 'gl', 'h', 'hy', 'hr', 'j', 'k', 'kh', 'kr', 'l', 'll', 'm', 'n', 'p', 'pr', 'r', 'rh', 's', 'sk', 'sg', 'sm', 'sn', 'st', 't', 'th', 'thr', 'ty', 'v', 'y'],
  nm3: ['bl', 'br', 'd', 'db', 'dbr', 'dd', 'ddg', 'dg', 'dl', 'dm', 'dr', 'dv', 'f', 'fd', 'fgr', 'fk', 'fl', 'fn', 'fr', 'fst', 'fv', 'g', 'gb', 'gd', 'gf', 'gg', 'ggv', 'gl', 'gn', 'gr', 'gss', 'gv', 'k', 'kk', 'l', 'lb', 'lc', 'ld', 'ldr', 'lf', 'lfr', 'lg', 'lgr', 'lk', 'll', 'llg', 'llk', 'llv', 'lm', 'ln', 'lp', 'lr', 'ls', 'lsk', 'lsn', 'lst', 'lsv', 'lt', 'lv', 'm', 'md', 'mk', 'ml', 'mm', 'ms', 'n', 'nb', 'nd', 'ndr', 'ng', 'nl', 'nn', 'nng', 'nr', 'nsk', 'nt', 'nv', 'nw', 'p', 'pl', 'pp', 'pr', 'r', 'rb', 'rd', 'rdg', 'rf', 'rg', 'rgr', 'rk', 'rkm', 'rl', 'rls', 'rm', 'rn', 'rng', 'rngr', 'rnh', 'rnk', 'rns', 'rnv', 'rr', 'rst', 'rt', 'rth', 'rtm', 'rv', 's', 'sb', 'sbr', 'sg', 'sgr', 'sk', 'sl', 'sm', 'sn', 'sr', 'ssk', 'st', 'stm', 'str', 'sv', 't', 'tg', 'th', 'thg', 'thn', 'thr', 'thv', 'tm', 'tr', 'tt', 'ttf', 'tv', 'v', 'yv', 'z', 'zg', 'zl', 'zn'],
  nm4: ['d', 'dr', 'f', 'g', 'kr', 'k', 'l', 'ld', 'lf', 'lk', 'll', 'lr', 'm', 'mm', 'n', 'nd', 'nn', 'r', 'rd', 'rn', 'rr', 's', 'th', 't'],
  nm5: ['', '', '', 'b', 'br', 'bh', 'ch', 'd', 'dh', 'f', 'fr', 'g', 'gh', 'gr', 'gw', 'gl', 'h', 'j', 'k', 'kh', 'm', 'n', 'r', 'rh', 's', 'sh', 'st', 'sv', 't', 'th', 'thr', 'tr', 'v', 'w'],
  nm6: ['ae', 'ea', 'ie', 'ei', 'io', 'a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u'],
  nm7: ['bj', 'c', 'd', 'dd', 'df', 'dl', 'dr', 'f', 'ff', 'fl', 'fn', 'fr', 'fth', 'g', 'gd', 'gm', 'gn', 'gnh', 'gr', 'h', 'hh', 'k', 'l', 'ld', 'lf', 'lfh', 'lg', 'lgr', 'lh', 'lk', 'll', 'lm', 'lr', 'ls', 'lv', 'm', 'mm', 'n', 'nd', 'ndr', 'ng', 'ngr', 'ngv', 'nh', 'nl', 'nn', 'nnh', 'nr', 'ns', 'nt', 'nv', 'r', 'rd', 'rf', 'rg', 'rgh', 'rgr', 'rh', 'rk', 'rl', 'rm', 'rn', 'rnd', 'rng', 'rr', 'rst', 'rt', 'rth', 'rtr', 'rv', 's', 'sb', 'sd', 'sg', 'sh', 'sl', 'st', 'stn', 'str', 'sv', 't', 'thr', 'tk', 'tr', 'tt', 'tth', 'v', 'y', 'yj', 'ym', 'yn'],
  nm8: ['', '', '', '', 'f', 'g', 'h', 'l', 'n', 'nn', 's', 'sh', 'th', 'y'],
  malePresets: [
    'Thrud', 'Gath', 'Crom', 'Wulfgar', 'Hrothgar', 'Beowulf', 'Bjorn', 'Ragnar', 'Rollo', 'Erik',
    'Leif', 'Sven', 'Knut', 'Harald', 'Sigurd', 'Starkad', 'Tormod', 'Viggo', 'Yorick', 'Kane',
    'Brak', 'Kull', 'Bran', 'Slaine', 'Druss', 'Logen', 'Krod', 'Korg', 'Grognak', 'Tor',
    'Volstagg', 'Hogun', 'Fandral', 'Skurge', 'Heimdall', 'Tyr', 'Baldur', 'Vidar', 'Vali', 'Modi',
  ],
  femalePresets: [
    'Red Sonya', 'Valeria', 'Bellit', 'Freya', 'Sigrid', 'Lagertha', 'Brynhild', 'Gudrun', 'Helga', 'Astrid',
    'Ingrid', 'Thyra', 'Gunnhild', 'Yrsa', 'Sif', 'Eowyn', 'Boudicca', 'Zenobia', 'Hippolyta', 'Penthesilea',
    'Atalanta', 'Artemisia', 'Tomoe', 'Khutulun', 'Cynane', 'Alfhild', 'Rusla', 'Webiorg', 'Hetha', 'Skadi',
  ],
} as const;

const generateBarbarian = (gender: NameGender): string => {
  if (Math.random() < 0.5) {
    return pick(gender === 'male' ? BARBARIAN.malePresets : BARBARIAN.femalePresets);
  }

  // Procedural (kept close to upstream implementation)
  if (gender === 'male') {
    const rnd = Math.floor(Math.random() * BARBARIAN.nm2.length);
    const rnd2 = Math.floor(Math.random() * BARBARIAN.nm1.length);
    const rnd3 = Math.floor(Math.random() * BARBARIAN.nm4.length);
    let rnd4 = Math.floor(Math.random() * BARBARIAN.nm1.length);
    const rnd5 = Math.floor(Math.random() * BARBARIAN.nm3.length);
    let rnd6 = Math.floor(Math.random() * BARBARIAN.nm1.length);
    const rnd7 = Math.floor(Math.random() * BARBARIAN.nm3.length);

    if (rnd < 3) {
      while (rnd4 < 3) rnd4 = Math.floor(Math.random() * BARBARIAN.nm1.length);
    }
    if (rnd < 3 || rnd4 < 3) {
      while (rnd6 < 3) rnd6 = Math.floor(Math.random() * BARBARIAN.nm1.length);
    }

    const n =
      BARBARIAN.nm2[rnd] +
      BARBARIAN.nm1[rnd2] +
      BARBARIAN.nm3[rnd5] +
      BARBARIAN.nm1[rnd4] +
      BARBARIAN.nm3[rnd7] +
      BARBARIAN.nm1[rnd6] +
      BARBARIAN.nm4[rnd3];
    return capitalize(n);
  }

  let rnd = Math.floor(Math.random() * BARBARIAN.nm5.length);
  const rnd2 = Math.floor(Math.random() * BARBARIAN.nm6.length);
  const rnd3 = Math.floor(Math.random() * BARBARIAN.nm8.length);
  let rnd4 = Math.floor(Math.random() * BARBARIAN.nm6.length);
  const rnd5 = Math.floor(Math.random() * BARBARIAN.nm7.length);
  let rnd6 = Math.floor(Math.random() * BARBARIAN.nm6.length);
  const rnd7 = Math.floor(Math.random() * BARBARIAN.nm7.length);

  if (rnd < 5) {
    while (rnd < 5) rnd = Math.floor(Math.random() * BARBARIAN.nm5.length);
  }
  if (rnd2 < 5) {
    while (rnd4 < 5) rnd4 = Math.floor(Math.random() * BARBARIAN.nm6.length);
  }
  if (rnd2 < 5 || rnd4 < 5) {
    while (rnd6 < 5) rnd6 = Math.floor(Math.random() * BARBARIAN.nm6.length);
  }

  const n =
    BARBARIAN.nm5[rnd] +
    BARBARIAN.nm6[rnd2] +
    BARBARIAN.nm7[rnd5] +
    BARBARIAN.nm6[rnd4] +
    BARBARIAN.nm7[rnd7] +
    BARBARIAN.nm6[rnd6] +
    BARBARIAN.nm8[rnd3];
  return capitalize(n);
};

// --- Lusitania (ported from /d:/code/pleb/nameGenerators/lusitaniaNames.js) ---
const LUSITANIA = {
  maleStart: ['Al', 'Fer', 'Mar', 'Gui', 'Ema', 'Ro', 'Dal', 'Gio', 'Alv', 'Vin'],
  maleMid: ['an', 'di', 'do', 'ro', 'ma', 'ber', 'car', 'ver', 'ri', 'se'],
  maleEnd: ['io', 'so', 'to', 'ar', 'ar', 'o', 'ino', 'es', 'el', 'al'],

  femaleStart: ['Ma', 'Al', 'Ro', 'Li', 'Eu', 'An', 'Be', 'Ca', 'El', 'Si'],
  femaleMid: ['ri', 'sa', 'ta', 'di', 'bo', 'lis', 'ra', 'me', 'do', 'co'],
  femaleEnd: ['na', 'lia', 'ta', 'ra', 'ia', 'la', 'ria', 'ela', 'sa', 'nda'],

  lusitanianMaleNames: [
    'Afonso', 'Rodrigo', 'Mateus', 'Tomas', 'Joao',
    'Lorenzo', 'Henrique', 'Gaspar', 'Rui', 'Vicente',
    'Carlos', 'Guilherme', 'Antonio', 'Eduardo', 'Bernardo',
    'Francesco', 'Marco', 'Pietro', 'Vittorio', 'Duarte',
  ],
  lusitanianFemaleNames: [
    'Isabela', 'Sofia', 'Ana', 'Lucia', 'Teresa',
    'Helena', 'Beatriz', 'Mariana', 'Luisa', 'Catarina',
    'Gabriela', 'Diana', 'Amelia', 'Carlota', 'Patricia',
    'Elena', 'Francesca', 'Valentina', 'Chiara', 'Leonor',
  ],
} as const;

const generateLusitania = (gender: NameGender): string => {
  if (Math.random() >= 0.5) {
    const list = gender === 'male' ? LUSITANIA.lusitanianMaleNames : LUSITANIA.lusitanianFemaleNames;
    return pick(list);
  }

  const syllableCount = Math.floor(Math.random() * 4) + 2; // 2-5
  const syllables: string[] = [];

  if (gender === 'male') {
    syllables.push(pick(LUSITANIA.maleStart));
    for (let i = 0; i < syllableCount - 2; i++) syllables.push(pick(LUSITANIA.maleMid));
    syllables.push(pick(LUSITANIA.maleEnd));
  } else {
    syllables.push(pick(LUSITANIA.femaleStart));
    for (let i = 0; i < syllableCount - 2; i++) syllables.push(pick(LUSITANIA.femaleMid));
    syllables.push(pick(LUSITANIA.femaleEnd));
  }

  return titleCaseFirst(syllables.join(''));
};

// --- Oriental (ported from /d:/code/pleb/nameGenerators/orientalNames.js) ---
const ORIENTAL = {
  maleStart: [
    'Kai', 'Ryu', 'Ken', 'Shin', 'Taka', 'Hiro', 'Yasu', 'Masa', 'Nobu', 'Toshi',
    'Zhe', 'Jin', 'Chen', 'Xia', 'Bao', 'Feng', 'Hui', 'Jian', 'Ming', 'Wei',
    'Som', 'Sou', 'Pon', 'Bun', 'Chan', 'Kham', 'Phon', 'Seng', 'Vieng', 'Xay',
  ],
  maleMid: [
    'shu', 'kun', 'suke', 'chi', 'roku', 'nori', 'hiko', 'taka', 'yuki', 'moto',
    'long', 'wei', 'ming', 'rou', 'feng', 'hua', 'xiang', 'zhong', 'yang', 'ping',
    'sam', 'nak', 'phet', 'thong', 'vong', 'lay', 'keo', 'song', 'phan', 'rack',
  ],
  maleEnd: [
    'shi', 'ro', 'to', 'ki', 'ru', 'ji', 'ya', 'zo', 'ke', 'ma',
    'tao', 'gan', 'lin', 'hui', 'dong', 'jun', 'cao', 'bin', 'fei', 'wu',
    'seng', 'rak', 'thy', 'nan', 'lok', 'vong', 'lay', 'det', 'von', 'sinh',
  ],

  femaleStart: [
    'Mei', 'Saku', 'Aki', 'Haru', 'Kyo', 'Mido', 'Nao', 'Rei', 'Sae', 'Yuka',
    'Hua', 'Lin', 'Yue', 'Xiu', 'Bai', 'Fei', 'Jing', 'Lan', 'Qing', 'Zhi',
    'Som', 'Chan', 'Kham', 'Phim', 'Seng', 'Thy', 'Vien', 'Xay', 'Keo', 'Nou',
  ],
  femaleMid: [
    'mi', 'ko', 'ra', 'yu', 'rei', 'chi', 'na', 'rin', 'sa', 'tsu',
    'ying', 'hua', 'xia', 'mei', 'li', 'zhen', 'qian', 'feng', 'wei', 'ju',
    'tha', 'ny', 'ly', 'phi', 'si', 'vi', 'ma', 'ri', 'sa', 'da',
  ],
  femaleEnd: [
    'ko', 'mi', 'ka', 'ri', 'na', 'ho', 'yo', 'ki', 'ne', 'me',
    'mei', 'ling', 'yan', 'pin', 'fen', 'xue', 'yue', 'hua', 'zhi', 'qi',
    'ny', 'thy', 'ry', 'sy', 'ly', 'vy', 'dy', 'py', 'my', 'ky',
  ],

  orientalMaleNames: [
    'Akira', 'Daisuke', 'Haruki', 'Hiroshi', 'Ichiro', 'Kaito', 'Kenji',
    'Masashi', 'Takeshi', 'Yamato', 'Satoshi', 'Ryota', 'Kazuki', 'Daiki',
    'Takashi', 'Shigeru', 'Yosuke', 'Tatsuya', 'Kazuo', 'Noboru',
    'Wei Ming', 'Jian Yu', 'Feng Jun', 'Chen Gang', 'Hong Long', 'Tao Bo',
    'Lei Ping', 'Wu Chen', 'Xiang Zhe', 'Yuan Ting', 'Li Wei', 'Zhang Min',
    'Wang Lei', 'Liu Yang', 'Sun Tzu', 'Zhao Yun', 'Guo Jing', 'Huang Fu',
    'Cao Wei', 'Shen Yi',
    'Sokha', 'Vibol', 'Chamroeun', 'Dara', 'Kosal', 'Nimol', 'Phirun',
    'Rith', 'Sophal', 'Thearith', 'Ponlok', 'Makara', 'Vannak', 'Sovann',
    'Piseth', 'Rithy', 'Sambath', 'Veasna', 'Chantha', 'Chann',
  ],
  orientalFemaleNames: [
    'Akane', 'Yuki', 'Hanako', 'Kaori', 'Keiko', 'Kumiko', 'Sakura',
    'Yumi', 'Aiko', 'Michiko', 'Haruka', 'Misaki', 'Natsumi', 'Rin',
    'Saki', 'Ayumi', 'Nanami', 'Yuka', 'Chihiro', 'Asuka',
    'Mei Ling', 'Xia Yan', 'Hui Juan', 'Hong Ying', 'Li Feng', 'Min Hua',
    'Jing Yi', 'Xue Lan', 'Yu Mei', 'Zhen Ni', 'Bai Xue', 'Chen Yue',
    'Fang Hua', 'Lin Qing', 'Liu Yi', 'Sun Li', 'Wu Ying', 'Xiao Mei',
    'Yang Zi', 'Zhou Wei',
    'Bopha', 'Channary', 'Kalliyan', 'Kolab', 'Malis', 'Romdoul',
    'Sothy', 'Sopheap', 'Thida', 'Vanna', 'Socheata', 'Pich', 'Rachana',
    'Sothea', 'Kunthea', 'Davy', 'Chenda', 'Sophea', 'Montha', 'Leakhena',
  ],
} as const;

const generateOriental = (gender: NameGender): string => {
  if (Math.random() >= 0.5) {
    return pick(gender === 'male' ? ORIENTAL.orientalMaleNames : ORIENTAL.orientalFemaleNames);
  }

  const syllableCount = Math.floor(Math.random() * 4) + 2; // 2-5
  const syllables: string[] = [];

  if (gender === 'male') {
    syllables.push(pick(ORIENTAL.maleStart));
    for (let i = 0; i < syllableCount - 2; i++) syllables.push(pick(ORIENTAL.maleMid));
    syllables.push(pick(ORIENTAL.maleEnd));
  } else {
    syllables.push(pick(ORIENTAL.femaleStart));
    for (let i = 0; i < syllableCount - 2; i++) syllables.push(pick(ORIENTAL.femaleMid));
    syllables.push(pick(ORIENTAL.femaleEnd));
  }

  return capitalize(syllables.join(''));
};

// --- Q'haran (ported from /d:/code/pleb/nameGenerators/qharanNames.js) ---
const QHARAN = {
  male: [
    'Malik', 'Hassan', 'Karim', 'Jamal', 'Rashid',
    'Tariq', 'Zafar', 'Qadir', 'Nasir', 'Khalil',
    'Azim', 'Hakim', 'Salim', 'Wasim', 'Basil',
    'Farid', 'Zahir', 'Rafik', 'Nabil', 'Samir',
    'Al-Hazir', 'Nur-Din', 'Saif-Allah', 'Badr-El', 'Zul-Qar',
    'Asad-Din', 'Najm-El', 'Shams-Din', 'Imad-Din', 'Fakhr-El',
  ],
  female: [
    'Amira', 'Layla', 'Nadia', 'Samira', 'Karima',
    'Jamila', 'Nadira', 'Zahra', 'Malika', 'Safiya',
    'Naima', 'Rania', 'Dalila', 'Farida', 'Hasina',
    'Jalila', 'Latifa', 'Nabila', 'Qamara', 'Sabrina',
    'Nur-El', 'Badr-El', 'Qamar-Din', 'Shams-El', 'Zain-El',
    'Amat-Allah', 'Sitt-El', 'Durr-El', 'Fakhr-El', 'Husn-El',
  ],
  patterns: {
    start: ['Al', 'El', 'Qa', 'Sa', 'Za', 'Ba', 'Na', 'Ma', 'Ka', 'Ha'],
    middle: ['li', 'ri', 'si', 'mi', 'di', 'fi', 'hi', 'zi', 'ni', 'qi'],
    end: ['m', 'r', 'd', 'f', 'l', 'n', 'b', 'h', 'k', 'q'],
    titles: [
      'al-Din', 'el-Haq', 'al-Nur', 'el-Qadir', 'al-Azim',
      'el-Hakim', 'al-Rashid', 'el-Karim', 'al-Malik',
    ],
  },
} as const;

const generateQharan = (gender: NameGender): string => {
  if (Math.random() < 0.5) return pick(QHARAN[gender]);

  const base =
    pick(QHARAN.patterns.start) +
    pick(QHARAN.patterns.middle) +
    pick(QHARAN.patterns.end);
  let name = titleCaseFirst(base);

  if (Math.random() < 0.3) name = `${name} ${pick(QHARAN.patterns.titles)}`;
  return name;
};

export const generateName = (culture: NameCultureId, gender: NameGender = 'male'): string => {
  switch (culture) {
    case 'ledger':
      return generateRandomName();
    case 'aquilonian':
      return generateAquilonian(gender);
    case 'barbarian':
      return generateBarbarian(gender);
    case 'lusitania':
      return generateLusitania(gender);
    case 'oriental':
      return generateOriental(gender);
    case 'qharan':
      return generateQharan(gender);
    default: {
      const _exhaustive: never = culture;
      return _exhaustive;
    }
  }
};

export const generateSurname = (): string => pick(DEFAULT_NAME_PARTS.last);

export const generateFullName = (opts: {
  culture: NameCultureId;
  gender?: NameGender;
  includeSurname?: boolean;
}): string => {
  const first = generateName(opts.culture, opts.gender ?? 'male');
  if (!opts.includeSurname || opts.culture === 'ledger') return normalizeSpace(first);
  return normalizeSpace(`${first} ${generateSurname()}`);
};

export const generateBatch = (opts: {
  culture: NameCultureId;
  gender?: NameGender;
  includeSurname?: boolean;
  count: number;
  unique?: boolean;
}): string[] => {
  const count = Math.max(1, Math.min(100, Math.floor(opts.count || 1)));
  const unique = opts.unique !== false;

  if (!unique) {
    return Array.from({ length: count }, () => generateFullName(opts));
  }

  const out: string[] = [];
  const seen = new Set<string>();
  const maxAttempts = Math.max(250, count * 40);

  for (let i = 0; i < maxAttempts && out.length < count; i++) {
    const n = generateFullName(opts);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }

  // Fall back to allowing duplicates if the source space is too small.
  while (out.length < count) out.push(generateFullName(opts));
  return out;
};
