import { AnimalSpecies } from '../types/animal';

export interface SpeciesConfig {
  id: AnimalSpecies;
  label: string;
  emoji: string;
  maleTerm: string;
  femaleTerm: string;
  sireTerm: string;
  damTerm: string;
  tagPrefixMale: string;
  tagPrefixFemale: string;
}

export const SPECIES_CONFIGS: Record<AnimalSpecies, SpeciesConfig> = {
  sheep: {
    id: 'sheep',
    label: 'Sheep',
    emoji: '🐑',
    maleTerm: 'Ram',
    femaleTerm: 'Ewe',
    sireTerm: 'Sire (Father)',
    damTerm: 'Dam (Mother)',
    tagPrefixMale: 'RAM',
    tagPrefixFemale: 'EWE',
  },
  goat: {
    id: 'goat',
    label: 'Goat',
    emoji: '🐐',
    maleTerm: 'Buck',
    femaleTerm: 'Doe',
    sireTerm: 'Sire (Father)',
    damTerm: 'Dam (Mother)',
    tagPrefixMale: 'BCK',
    tagPrefixFemale: 'DOE',
  },
  cattle: {
    id: 'cattle',
    label: 'Cattle',
    emoji: '🐄',
    maleTerm: 'Bull',
    femaleTerm: 'Cow',
    sireTerm: 'Sire (Father)',
    damTerm: 'Dam (Mother)',
    tagPrefixMale: 'BUL',
    tagPrefixFemale: 'COW',
  },
  pig: {
    id: 'pig',
    label: 'Pig / Swine',
    emoji: '🐖',
    maleTerm: 'Boar',
    femaleTerm: 'Sow',
    sireTerm: 'Sire (Father)',
    damTerm: 'Dam (Mother)',
    tagPrefixMale: 'BOR',
    tagPrefixFemale: 'SOW',
  },
  poultry: {
    id: 'poultry',
    label: 'Poultry',
    emoji: '🐓',
    maleTerm: 'Rooster',
    femaleTerm: 'Hen',
    sireTerm: 'Sire (Rooster Line)',
    damTerm: 'Dam (Hen Line)',
    tagPrefixMale: 'RST',
    tagPrefixFemale: 'HEN',
  },
  rabbit: {
    id: 'rabbit',
    label: 'Rabbit',
    emoji: '🐇',
    maleTerm: 'Buck',
    femaleTerm: 'Doe',
    sireTerm: 'Sire (Father)',
    damTerm: 'Dam (Mother)',
    tagPrefixMale: 'BCK',
    tagPrefixFemale: 'DOE',
  },
  horse: {
    id: 'horse',
    label: 'Horse / Equine',
    emoji: '🐎',
    maleTerm: 'Stallion',
    femaleTerm: 'Mare',
    sireTerm: 'Sire (Father)',
    damTerm: 'Dam (Mother)',
    tagPrefixMale: 'STL',
    tagPrefixFemale: 'MAR',
  },
  other: {
    id: 'other',
    label: 'Other Livestock',
    emoji: '🐾',
    maleTerm: 'Male',
    femaleTerm: 'Female',
    sireTerm: 'Sire (Father)',
    damTerm: 'Dam (Mother)',
    tagPrefixMale: 'MAL',
    tagPrefixFemale: 'FEM',
  },
};

export function getSpeciesConfig(species?: AnimalSpecies | string | null): SpeciesConfig {
  const key = (species?.toLowerCase() || 'sheep') as AnimalSpecies;
  return SPECIES_CONFIGS[key] || SPECIES_CONFIGS.sheep;
}

export function getSexTerm(sex: 'male' | 'female', species?: AnimalSpecies | string | null): string {
  const config = getSpeciesConfig(species);
  const term = sex === 'male' ? config.maleTerm : config.femaleTerm;
  const icon = sex === 'male' ? '♂' : '♀';
  return `${icon} ${term}`;
}

export function getSpeciesBadge(species?: AnimalSpecies | string | null): string {
  const config = getSpeciesConfig(species);
  return `${config.emoji} ${config.label}`;
}
