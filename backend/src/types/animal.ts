export type AnimalSex = 'male' | 'female';
export type AnimalStatus = 'active' | 'sold' | 'culled';
export type AnimalSpecies =
  | 'sheep'
  | 'goat'
  | 'cattle'
  | 'pig'
  | 'poultry'
  | 'rabbit'
  | 'horse'
  | 'other';

export interface Animal {
  id: string;
  farm_id: string;
  sheep_id: string;
  species?: AnimalSpecies;
  birth_year: number | null;
  family_line: string | null;
  sire_id: string | null;
  dam_id: string | null;
  sex: AnimalSex;
  breed: string;
  date_of_birth: string | null;
  status: AnimalStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimalWithParents extends Animal {
  sire?: AnimalSummary | null;
  dam?: AnimalSummary | null;
}

export interface AnimalSummary {
  id: string;
  sheep_id: string;
  species?: AnimalSpecies;
  sex: AnimalSex;
  breed: string;
  status: AnimalStatus;
}

export interface CreateAnimalDTO {
  sheep_id?: string;
  species?: AnimalSpecies;
  birth_year?: number | null;
  family_line?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  sex: AnimalSex;
  breed: string;
  date_of_birth?: string | null;
  status?: AnimalStatus;
  notes?: string | null;
}

export interface UpdateAnimalDTO {
  sheep_id?: string;
  species?: AnimalSpecies;
  birth_year?: number | null;
  family_line?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  sex?: AnimalSex;
  breed?: string;
  date_of_birth?: string | null;
  status?: AnimalStatus;
  notes?: string | null;
}

export interface AnimalQueryFilters {
  species?: AnimalSpecies;
  status?: AnimalStatus;
  breed?: string;
  sex?: AnimalSex;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LineageNode {
  id: string;
  sheep_id: string;
  species?: AnimalSpecies;
  sex: AnimalSex;
  breed: string;
  status: AnimalStatus;
  family_line: string | null;
  birth_year: number | null;
  sire?: LineageNode | null;
  dam?: LineageNode | null;
}
