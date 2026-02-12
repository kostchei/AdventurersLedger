import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateRandomName } from '../src/utils/randomName';
import { generateBatch, generateFullName, generateName, type NameCultureId } from '../src/utils/nameGenerator';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('randomName', () => {
  it('uses default first/last pools when no config is provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(generateRandomName()).toBe('Alden Ashford');
  });

  it('uses species-specific config pools when available', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const config = {
      nameGenerator: {
        bySpecies: {
          Elf: { first: ['Aelar'], last: ['Galanodel'] },
        },
      },
    };
    expect(generateRandomName(config, 'Elf')).toBe('Aelar Galanodel');
  });

  it('falls back missing first/last config values to defaults', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const config = {
      nameGenerator: {
        default: { first: ['OnlyFirst'] },
      },
    };
    expect(generateRandomName(config)).toBe('OnlyFirst Ashford');
  });
});

describe('nameGenerator', () => {
  it('generates a non-empty name for every culture', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const cultures: NameCultureId[] = ['ledger', 'aquilonian', 'barbarian', 'lusitania', 'oriental', 'qharan'];

    for (const culture of cultures) {
      const n = generateName(culture, 'male');
      expect(typeof n).toBe('string');
      expect(n.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes a surname for non-ledger cultures when requested', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const n = generateFullName({ culture: 'aquilonian', gender: 'male', includeSurname: true });
    expect(n.split(' ').length).toBeGreaterThanOrEqual(2);
  });

  it('omits appended surname for non-ledger cultures when includeSurname=false', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const n = generateFullName({ culture: 'aquilonian', gender: 'male', includeSurname: false });
    expect(n.split(' ').length).toBe(1);
  });

  it('clamps batch count between 1 and 100', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(generateBatch({ culture: 'ledger', count: 0 }).length).toBe(1);
    expect(generateBatch({ culture: 'ledger', count: 101 }).length).toBe(100);
  });

  it('falls back to duplicates when unique generation cannot satisfy count', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const out = generateBatch({ culture: 'ledger', count: 3, unique: true });
    expect(out.length).toBe(3);
    expect(new Set(out).size).toBe(1);
    expect(out[0]).toBe('Alden Ashford');
  });
});
