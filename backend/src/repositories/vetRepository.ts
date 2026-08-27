import { supabase } from '../config/supabaseClient.js';
import {
  VetRecord,
  VetRecordWithAnimal,
  CreateVetRecordDTO,
  UpdateVetRecordDTO,
  VetRecordFilters,
  WithdrawalStatusInfo,
} from '../types/vet.js';

export class VetRepository {
  /**
   * Find paginated vet treatment records for a farm.
   */
  async findManyByFarmId(
    farmId: string,
    filters: VetRecordFilters
  ): Promise<{ data: VetRecordWithAnimal[]; meta: { page: number; limit: number; total: number } }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 25;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('vet_records')
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
    if (filters.from) {
      query = query.gte('treatment_date', filters.from);
    }
    if (filters.to) {
      query = query.lte('treatment_date', filters.to);
    }
    if (filters.search) {
      const search = `%${filters.search}%`;
      query = query.or(`product_name.ilike.${search},reason.ilike.${search},veterinarian_name.ilike.${search}`);
    }

    query = query.order('treatment_date', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      data: (data || []) as VetRecordWithAnimal[],
      meta: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Find single vet record by ID.
   */
  async findById(farmId: string, recordId: string): Promise<VetRecordWithAnimal | null> {
    const { data, error } = await supabase
      .from('vet_records')
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as VetRecordWithAnimal;
  }

  /**
   * Create a new vet treatment record.
   */
  async create(farmId: string, createdBy: string, dto: CreateVetRecordDTO): Promise<VetRecordWithAnimal> {
    const payload = {
      farm_id: farmId,
      animal_id: dto.animal_id,
      treatment_date: dto.treatment_date,
      product_name: dto.product_name.trim(),
      batch_number: dto.batch_number?.trim() || null,
      quantity_administered: dto.quantity_administered?.trim() || null,
      route: dto.route,
      reason: dto.reason?.trim() || null,
      administered_by: dto.administered_by?.trim() || null,
      withdrawal_period_days: dto.withdrawal_period_days ?? 0,
      veterinarian_name: dto.veterinarian_name?.trim() || null,
      outcome: dto.outcome?.trim() || null,
      notes: dto.notes?.trim() || null,
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .from('vet_records')
      .insert(payload)
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .single();

    if (error) throw error;
    return data as VetRecordWithAnimal;
  }

  /**
   * Update an existing vet record.
   */
  async update(farmId: string, recordId: string, dto: UpdateVetRecordDTO): Promise<VetRecordWithAnimal> {
    const payload: Record<string, any> = {};

    if (dto.animal_id !== undefined) payload.animal_id = dto.animal_id;
    if (dto.treatment_date !== undefined) payload.treatment_date = dto.treatment_date;
    if (dto.product_name !== undefined) payload.product_name = dto.product_name.trim();
    if (dto.batch_number !== undefined) payload.batch_number = dto.batch_number?.trim() || null;
    if (dto.quantity_administered !== undefined)
      payload.quantity_administered = dto.quantity_administered?.trim() || null;
    if (dto.route !== undefined) payload.route = dto.route;
    if (dto.reason !== undefined) payload.reason = dto.reason?.trim() || null;
    if (dto.administered_by !== undefined) payload.administered_by = dto.administered_by?.trim() || null;
    if (dto.withdrawal_period_days !== undefined) payload.withdrawal_period_days = dto.withdrawal_period_days;
    if (dto.veterinarian_name !== undefined) payload.veterinarian_name = dto.veterinarian_name?.trim() || null;
    if (dto.outcome !== undefined) payload.outcome = dto.outcome?.trim() || null;
    if (dto.notes !== undefined) payload.notes = dto.notes?.trim() || null;

    const { data, error } = await supabase
      .from('vet_records')
      .update(payload)
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .single();

    if (error) throw error;
    return data as VetRecordWithAnimal;
  }

  /**
   * Delete a vet record.
   */
  async delete(farmId: string, recordId: string): Promise<void> {
    const { error } = await supabase
      .from('vet_records')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', recordId);

    if (error) throw error;
  }

  /**
   * Query vet_withdrawal_status view for a specific animal.
   */
  async getWithdrawalStatusForAnimal(farmId: string, animalId: string): Promise<WithdrawalStatusInfo | null> {
    const { data, error } = await supabase
      .from('vet_withdrawal_status')
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .eq('farm_id', farmId)
      .eq('animal_id', animalId)
      .eq('is_withdrawal_active', true)
      .order('withdrawal_end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as WithdrawalStatusInfo | null;
  }

  /**
   * Query vet_withdrawal_status view for all active withdrawals on a farm.
   */
  async listActiveWithdrawals(farmId: string): Promise<WithdrawalStatusInfo[]> {
    const { data, error } = await supabase
      .from('vet_withdrawal_status')
      .select(
        `
        *,
        animal:animals!animal_id (id, sheep_id, sex, breed, status)
      `
      )
      .eq('farm_id', farmId)
      .eq('is_withdrawal_active', true)
      .order('withdrawal_end_date', { ascending: true });

    if (error) throw error;
    return (data || []) as WithdrawalStatusInfo[];
  }
}
