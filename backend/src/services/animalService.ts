import { AnimalRepository } from '../repositories/animalRepository.js';
import { VetRepository } from '../repositories/vetRepository.js';
import { supabase } from '../config/supabaseClient.js';
import {
  AnimalWithParents,
  CreateAnimalDTO,
  UpdateAnimalDTO,
  AnimalQueryFilters,
  LineageNode,
} from '../types/animal.js';

import { getSpeciesConfig } from '../utils/speciesUtils.js';

export interface UpdateAnimalOptions {
  override?: boolean;
  override_reason?: string;
  userId?: string;
}

export class AnimalService {
  private animalRepository: AnimalRepository;
  private vetRepository: VetRepository;

  constructor() {
    this.animalRepository = new AnimalRepository();
    this.vetRepository = new VetRepository();
  }

  async getAnimals(
    farmId: string,
    filters: AnimalQueryFilters
  ): Promise<{ data: AnimalWithParents[]; meta: { page: number; limit: number; total: number } }> {
    return this.animalRepository.findManyByFarmId(farmId, filters);
  }

  /**
   * Helper to resolve an animal ID or Tag ID (sheep_id) to a primary UUID.
   * Note: Non-UUID Tag ID lookup is allowed in Development Mode to support editing legacy/invalid IDs.
   * To be restricted to UUID-only lookups in Phase 9 Production Hardening.
   */
  private async resolveAnimalId(farmId: string, identifier: string): Promise<string | null> {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);
    if (isUuid) return identifier;

    // Dev Fallback: Lookup by sheep_id (Tag ID)
    const raw = await this.animalRepository.findBySheepId(farmId, identifier);
    return raw ? raw.id : null;
  }

  async getAnimalById(farmId: string, animalIdOrTag: string): Promise<AnimalWithParents> {
    const resolvedId = await this.resolveAnimalId(farmId, animalIdOrTag);
    if (!resolvedId) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }
    const animal = await this.animalRepository.findById(farmId, resolvedId);
    if (!animal) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }
    return animal;
  }

  async createAnimal(farmId: string, dto: CreateAnimalDTO): Promise<AnimalWithParents> {
    if (!dto.breed || !dto.breed.trim()) {
      const error: any = new Error('Breed is required.');
      error.statusCode = 400;
      error.code = 'MISSING_FIELD';
      throw error;
    }

    if (!dto.sex || !['male', 'female'].includes(dto.sex)) {
      const error: any = new Error('Sex must be either "male" or "female".');
      error.statusCode = 400;
      error.code = 'INVALID_SEX';
      throw error;
    }

    // Auto-generate sheep_id (Tag ID) if omitted
    let finalSheepId = dto.sheep_id?.trim();
    if (!finalSheepId) {
      const speciesConfig = getSpeciesConfig(dto.species);
      const prefix = dto.sex === 'male' ? speciesConfig.tagPrefixMale : speciesConfig.tagPrefixFemale;
      const randNum = Math.floor(1000 + Math.random() * 9000);
      finalSheepId = `${prefix}-${randNum}`;
    }

    // Check unique sheep_id in this farm, auto-resolve collisions
    const existing = await this.animalRepository.findBySheepId(farmId, finalSheepId);
    if (existing) {
      if (dto.sheep_id?.trim()) {
        // Explicitly passed sheep_id collides
        const error: any = new Error(`An animal with Tag ID "${dto.sheep_id.trim()}" already exists on this farm.`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_SHEEP_ID';
        throw error;
      } else {
        // Auto-generated ID collides -> add unique timestamp suffix
        finalSheepId = `${finalSheepId}-${Date.now().toString().slice(-4)}`;
      }
    }

    // Auto-calculate birth_year from date_of_birth if birth_year is missing
    let finalBirthYear = dto.birth_year;
    if (!finalBirthYear && dto.date_of_birth) {
      const year = parseInt(dto.date_of_birth.trim().split('-')[0], 10);
      if (!isNaN(year) && year > 1900 && year <= 2100) {
        finalBirthYear = year;
      }
    }

    // Validate sire & dam if provided
    if (dto.sire_id) {
      const sire = await this.animalRepository.findById(farmId, dto.sire_id);
      if (!sire) {
        const error: any = new Error('Selected Sire animal does not exist on this farm.');
        error.statusCode = 400;
        error.code = 'INVALID_SIRE';
        throw error;
      }
    }

    if (dto.dam_id) {
      const dam = await this.animalRepository.findById(farmId, dto.dam_id);
      if (!dam) {
        const error: any = new Error('Selected Dam animal does not exist on this farm.');
        error.statusCode = 400;
        error.code = 'INVALID_DAM';
        throw error;
      }
    }

    return this.animalRepository.create(farmId, {
      ...dto,
      sheep_id: finalSheepId,
      birth_year: finalBirthYear ?? undefined,
    });
  }

  async updateAnimal(
    farmId: string,
    animalIdOrTag: string,
    dto: UpdateAnimalDTO,
    options?: UpdateAnimalOptions
  ): Promise<AnimalWithParents> {
    const animalId = await this.resolveAnimalId(farmId, animalIdOrTag);
    if (!animalId) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }

    // Confirm animal exists first
    const existing = await this.animalRepository.findById(farmId, animalId);
    if (!existing) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }

    // If sheep_id is being updated, check uniqueness
    if (dto.sheep_id && dto.sheep_id.trim() !== existing.sheep_id) {
      const duplicate = await this.animalRepository.findBySheepId(farmId, dto.sheep_id.trim());
      if (duplicate && duplicate.id !== animalId) {
        const error: any = new Error(`An animal with Tag ID "${dto.sheep_id.trim()}" already exists on this farm.`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_SHEEP_ID';
        throw error;
      }
    }

    // Prevent self as sire or dam
    if (dto.sire_id && dto.sire_id === animalId) {
      const error: any = new Error('An animal cannot be its own Sire.');
      error.statusCode = 400;
      error.code = 'INVALID_PEDIGREE';
      throw error;
    }

    if (dto.dam_id && dto.dam_id === animalId) {
      const error: any = new Error('An animal cannot be its own Dam.');
      error.statusCode = 400;
      error.code = 'INVALID_PEDIGREE';
      throw error;
    }

    // --- Withdrawal Period Enforcement ---
    if (dto.status === 'sold' && existing.status !== 'sold') {
      const activeWithdrawal = await this.vetRepository.getWithdrawalStatusForAnimal(farmId, animalId);

      if (activeWithdrawal && activeWithdrawal.is_withdrawal_active) {
        if (!options?.override || !options?.override_reason?.trim()) {
          const error: any = new Error(
            `Animal ${existing.sheep_id} is currently under an active vet withdrawal period until ${activeWithdrawal.withdrawal_end_date}. Marking as sold requires an explicit override and reason.`
          );
          error.statusCode = 409;
          error.code = 'WITHDRAWAL_ACTIVE';
          error.detail = {
            withdrawal_end_date: activeWithdrawal.withdrawal_end_date,
            vet_record_id: activeWithdrawal.vet_record_id,
          };
          throw error;
        }

        // Log override to notifications table
        await supabase.from('notifications').insert({
          farm_id: farmId,
          type: 'general',
          title: 'Withdrawal Compliance Override',
          body: `Animal ${existing.sheep_id} marked as "sold" during active withdrawal (ends ${activeWithdrawal.withdrawal_end_date}). Override Reason: ${options.override_reason.trim()}`,
          related_animal_id: animalId,
          created_by: options.userId || null,
        });
      }
    }

    const updateDto = { ...dto };
    if (updateDto.date_of_birth && updateDto.birth_year === undefined) {
      const year = parseInt(updateDto.date_of_birth.trim().split('-')[0], 10);
      if (!isNaN(year) && year > 1900 && year <= 2100) {
        updateDto.birth_year = year;
      }
    }

    return this.animalRepository.update(farmId, animalId, updateDto);
  }

  async deleteAnimal(farmId: string, animalIdOrTag: string): Promise<void> {
    const animalId = await this.resolveAnimalId(farmId, animalIdOrTag);
    if (!animalId) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }

    const existing = await this.animalRepository.findById(farmId, animalId);
    if (!existing) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }

    return this.animalRepository.delete(farmId, animalId);
  }

  async getAnimalLineage(farmId: string, animalIdOrTag: string): Promise<LineageNode> {
    const animalId = await this.resolveAnimalId(farmId, animalIdOrTag);
    if (!animalId) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }

    const lineage = await this.animalRepository.getLineageTree(farmId, animalId);
    if (!lineage) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }
    return lineage;
  }
}