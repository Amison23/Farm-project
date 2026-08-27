import { supabase } from '../config/supabaseClient.js';
import {
  Animal,
  AnimalWithParents,
  CreateAnimalDTO,
  UpdateAnimalDTO,
  AnimalQueryFilters,
  LineageNode,
} from '../types/animal.js';

export class AnimalRepository {
  /**
   * Find paginated list of animals for a specific farm with filters.
   */
  async findManyByFarmId(
    farmId: string,
    filters: AnimalQueryFilters
  ): Promise<{ data: AnimalWithParents[]; meta: { page: number; limit: number; total: number } }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 25;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('animals')
      .select(
        `
        *,
        sire:animals!sire_id (id, sheep_id, sex, breed, status),
        dam:animals!dam_id (id, sheep_id, sex, breed, status)
      `,
        { count: 'exact' }
      )
      .eq('farm_id', farmId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.breed) {
      query = query.ilike('breed', `%${filters.breed}%`);
    }
    if (filters.sex) {
      query = query.eq('sex', filters.sex);
    }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`sheep_id.ilike.${searchTerm},family_line.ilike.${searchTerm},notes.ilike.${searchTerm}`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      data: (data || []) as AnimalWithParents[],
      meta: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Find single animal by ID in a farm.
   */
  async findById(farmId: string, animalId: string): Promise<AnimalWithParents | null> {
    const { data, error } = await supabase
      .from('animals')
      .select(
        `
        *,
        sire:animals!sire_id (id, sheep_id, sex, breed, status),
        dam:animals!dam_id (id, sheep_id, sex, breed, status)
      `
      )
      .eq('farm_id', farmId)
      .eq('id', animalId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      throw error;
    }

    return data as AnimalWithParents;
  }

  /**
   * Find animal by sheep_id within a farm (useful for duplication checks).
   */
  async findBySheepId(farmId: string, sheepId: string): Promise<Animal | null> {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('farm_id', farmId)
      .eq('sheep_id', sheepId)
      .maybeSingle();

    if (error) throw error;
    return data as Animal | null;
  }

  /**
   * Create a new animal.
   */
  async create(farmId: string, dto: CreateAnimalDTO): Promise<AnimalWithParents> {
    const payload = {
      farm_id: farmId,
      sheep_id: dto.sheep_id ? dto.sheep_id.trim() : '',
      birth_year: dto.birth_year ?? null,
      family_line: dto.family_line?.trim() || null,
      sire_id: dto.sire_id || null,
      dam_id: dto.dam_id || null,
      sex: dto.sex,
      breed: dto.breed.trim(),
      date_of_birth: dto.date_of_birth || null,
      status: dto.status || 'active',
      notes: dto.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from('animals')
      .insert(payload)
      .select(
        `
        *,
        sire:animals!sire_id (id, sheep_id, sex, breed, status),
        dam:animals!dam_id (id, sheep_id, sex, breed, status)
      `
      )
      .single();

    if (error) throw error;
    return data as AnimalWithParents;
  }

  /**
   * Update an existing animal.
   */
  async update(farmId: string, animalId: string, dto: UpdateAnimalDTO): Promise<AnimalWithParents> {
    const payload: Record<string, any> = {};

    if (dto.sheep_id !== undefined) payload.sheep_id = dto.sheep_id.trim();
    if (dto.birth_year !== undefined) payload.birth_year = dto.birth_year;
    if (dto.family_line !== undefined) payload.family_line = dto.family_line?.trim() || null;
    if (dto.sire_id !== undefined) payload.sire_id = dto.sire_id || null;
    if (dto.dam_id !== undefined) payload.dam_id = dto.dam_id || null;
    if (dto.sex !== undefined) payload.sex = dto.sex;
    if (dto.breed !== undefined) payload.breed = dto.breed.trim();
    if (dto.date_of_birth !== undefined) payload.date_of_birth = dto.date_of_birth || null;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.notes !== undefined) payload.notes = dto.notes?.trim() || null;

    const { data, error } = await supabase
      .from('animals')
      .update(payload)
      .eq('farm_id', farmId)
      .eq('id', animalId)
      .select(
        `
        *,
        sire:animals!sire_id (id, sheep_id, sex, breed, status),
        dam:animals!dam_id (id, sheep_id, sex, breed, status)
      `
      )
      .single();

    if (error) throw error;
    return data as AnimalWithParents;
  }

  /**
   * Delete an animal.
   */
  async delete(farmId: string, animalId: string): Promise<void> {
    const { error } = await supabase
      .from('animals')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', animalId);

    if (error) throw error;
  }

  /**
   * Build 3-generation lineage tree for an animal in a farm.
   */
  async getLineageTree(farmId: string, animalId: string): Promise<LineageNode | null> {
    // 1. Fetch current animal
    const animal = await this.findById(farmId, animalId);
    if (!animal) return null;

    // Helper to fetch node recursively up to depth limit
    const fetchNode = async (id: string | null, depth: number): Promise<LineageNode | null> => {
      if (!id || depth > 3) return null;

      const { data, error } = await supabase
        .from('animals')
        .select('id, sheep_id, sex, breed, status, family_line, birth_year, sire_id, dam_id')
        .eq('farm_id', farmId)
        .eq('id', id)
        .single();

      if (error || !data) return null;

      const sireNode = depth < 3 ? await fetchNode(data.sire_id, depth + 1) : null;
      const damNode = depth < 3 ? await fetchNode(data.dam_id, depth + 1) : null;

      return {
        id: data.id,
        sheep_id: data.sheep_id,
        sex: data.sex,
        breed: data.breed,
        status: data.status,
        family_line: data.family_line,
        birth_year: data.birth_year,
        sire: sireNode,
        dam: damNode,
      };
    };

    const sireNode = await fetchNode(animal.sire_id, 2);
    const damNode = await fetchNode(animal.dam_id, 2);

    return {
      id: animal.id,
      sheep_id: animal.sheep_id,
      sex: animal.sex,
      breed: animal.breed,
      status: animal.status,
      family_line: animal.family_line,
      birth_year: animal.birth_year,
      sire: sireNode,
      dam: damNode,
    };
  }
}
