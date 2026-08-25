import { AnimalSummary } from './animal.js';

export interface FeedRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  feed_date: string;
  base: string;
  nutrient_supplement: string | null;
  quantity_per_head: string | null;
  outcome: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface FeedRecordWithAnimal extends FeedRecord {
  animal?: AnimalSummary | null;
}

export interface CreateFeedRecordDTO {
  animal_id: string;
  feed_date: string;
  base: string;
  nutrient_supplement?: string | null;
  quantity_per_head?: string | null;
  outcome?: string | null;
  notes?: string | null;
}

export interface UpdateFeedRecordDTO {
  animal_id?: string;
  feed_date?: string;
  base?: string;
  nutrient_supplement?: string | null;
  quantity_per_head?: string | null;
  outcome?: string | null;
  notes?: string | null;
}

export interface FeedRecordQueryFilters {
  animal_id?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
