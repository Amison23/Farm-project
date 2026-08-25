import { supabase } from '../config/supabaseClient.js';
import {
  FeedRecordWithAnimal,
  CreateFeedRecordDTO,
  UpdateFeedRecordDTO,
  FeedRecordQueryFilters,
} from '../types/feed.js';

export class FeedRepository {
  /**
   * Find paginated list of feed records for a farm with optional filters.
   */
  async findManyByFarmId(
    farmId: string,
    filters: FeedRecordQueryFilters
  ): Promise<{ data: FeedRecordWithAnimal[]; meta: { page: number; limit: number; total: number } }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 25;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('feed_records')
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `,
        { count: 'exact' }
      )
      .eq('farm_id', farmId);

    if (filters.animal_id) {
      query = query.eq('animal_id', filters.animal_id);
    }
    if (filters.startDate) {
      query = query.gte('feed_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('feed_date', filters.endDate);
    }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`base.ilike.${searchTerm},nutrient_supplement.ilike.${searchTerm},notes.ilike.${searchTerm},outcome.ilike.${searchTerm}`);
    }

    query = query.order('feed_date', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: (data || []) as FeedRecordWithAnimal[],
      meta: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Find all feed records for a specific animal in a farm.
   */
  async findByAnimalId(farmId: string, animalId: string): Promise<FeedRecordWithAnimal[]> {
    const { data, error } = await supabase
      .from('feed_records')
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .eq('farm_id', farmId)
      .eq('animal_id', animalId)
      .order('feed_date', { ascending: false });

    if (error) throw error;
    return (data || []) as FeedRecordWithAnimal[];
  }

  /**
   * Find a single feed record by ID.
   */
  async findById(farmId: string, id: string): Promise<FeedRecordWithAnimal | null> {
    const { data, error } = await supabase
      .from('feed_records')
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .eq('farm_id', farmId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as FeedRecordWithAnimal) || null;
  }

  /**
   * Insert a new feed record.
   */
  async create(farmId: string, userId: string, dto: CreateFeedRecordDTO): Promise<FeedRecordWithAnimal> {
    const payload = {
      farm_id: farmId,
      created_by: userId,
      animal_id: dto.animal_id,
      feed_date: dto.feed_date,
      base: dto.base,
      nutrient_supplement: dto.nutrient_supplement || null,
      quantity_per_head: dto.quantity_per_head || null,
      outcome: dto.outcome || null,
      notes: dto.notes || null,
    };

    const { data, error } = await supabase
      .from('feed_records')
      .insert(payload)
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .single();

    if (error) throw error;
    return data as FeedRecordWithAnimal;
  }

  /**
   * Update an existing feed record.
   */
  async update(farmId: string, id: string, dto: UpdateFeedRecordDTO): Promise<FeedRecordWithAnimal> {
    const payload: Record<string, any> = {};
    if (dto.animal_id !== undefined) payload.animal_id = dto.animal_id;
    if (dto.feed_date !== undefined) payload.feed_date = dto.feed_date;
    if (dto.base !== undefined) payload.base = dto.base;
    if (dto.nutrient_supplement !== undefined) payload.nutrient_supplement = dto.nutrient_supplement;
    if (dto.quantity_per_head !== undefined) payload.quantity_per_head = dto.quantity_per_head;
    if (dto.outcome !== undefined) payload.outcome = dto.outcome;
    if (dto.notes !== undefined) payload.notes = dto.notes;

    const { data, error } = await supabase
      .from('feed_records')
      .update(payload)
      .eq('farm_id', farmId)
      .eq('id', id)
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .single();

    if (error) throw error;
    return data as FeedRecordWithAnimal;
  }

  /**
   * Delete a feed record.
   */
  async delete(farmId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('feed_records')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', id);

    if (error) throw error;
  }
}
