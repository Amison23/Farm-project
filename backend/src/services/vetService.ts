import { VetRepository } from '../repositories/vetRepository.js';
import { AnimalRepository } from '../repositories/animalRepository.js';
import {
  VetRecordWithAnimal,
  CreateVetRecordDTO,
  UpdateVetRecordDTO,
  VetRecordFilters,
  WithdrawalStatusInfo,
} from '../types/vet.js';

export class VetService {
  private vetRepository: VetRepository;
  private animalRepository: AnimalRepository;

  constructor() {
    this.vetRepository = new VetRepository();
    this.animalRepository = new AnimalRepository();
  }

  async getVetRecords(
    farmId: string,
    filters: VetRecordFilters
  ): Promise<{ data: VetRecordWithAnimal[]; meta: { page: number; limit: number; total: number } }> {
    return this.vetRepository.findManyByFarmId(farmId, filters);
  }

  async getVetRecordById(farmId: string, recordId: string): Promise<VetRecordWithAnimal> {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(recordId);
    if (!isUuid) {
      const error: any = new Error('Invalid vet record ID format.');
      error.statusCode = 404;
      error.code = 'VET_RECORD_NOT_FOUND';
      throw error;
    }
    const record = await this.vetRepository.findById(farmId, recordId);
    if (!record) {
      const error: any = new Error('Vet treatment record not found.');
      error.statusCode = 404;
      error.code = 'VET_RECORD_NOT_FOUND';
      throw error;
    }
    return record;
  }

  async createVetRecord(farmId: string, createdBy: string, dto: CreateVetRecordDTO): Promise<VetRecordWithAnimal> {
    if (!dto.animal_id) {
      const error: any = new Error('Animal ID is required.');
      error.statusCode = 400;
      error.code = 'MISSING_ANIMAL_ID';
      throw error;
    }

    if (!dto.treatment_date) {
      const error: any = new Error('Treatment date is required.');
      error.statusCode = 400;
      error.code = 'MISSING_TREATMENT_DATE';
      throw error;
    }

    if (!dto.product_name || !dto.product_name.trim()) {
      const error: any = new Error('Product name is required.');
      error.statusCode = 400;
      error.code = 'MISSING_PRODUCT_NAME';
      throw error;
    }

    // Explicit Route selection check (per user request)
    if (!dto.route || !['oral', 'injection', 'topical', 'other'].includes(dto.route)) {
      const error: any = new Error('Please select a valid administration route (oral, injection, topical, or other).');
      error.statusCode = 400;
      error.code = 'MISSING_TREATMENT_ROUTE';
      throw error;
    }

    // Verify animal exists in this farm
    const animal = await this.animalRepository.findById(farmId, dto.animal_id);
    if (!animal) {
      const error: any = new Error('Animal not found on this farm.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }

    return this.vetRepository.create(farmId, createdBy, dto);
  }

  async updateVetRecord(
    farmId: string,
    recordId: string,
    dto: UpdateVetRecordDTO
  ): Promise<VetRecordWithAnimal> {
    const existing = await this.vetRepository.findById(farmId, recordId);
    if (!existing) {
      const error: any = new Error('Vet treatment record not found.');
      error.statusCode = 404;
      error.code = 'VET_RECORD_NOT_FOUND';
      throw error;
    }

    if (dto.route && !['oral', 'injection', 'topical', 'other'].includes(dto.route)) {
      const error: any = new Error('Invalid administration route specified.');
      error.statusCode = 400;
      error.code = 'INVALID_TREATMENT_ROUTE';
      throw error;
    }

    return this.vetRepository.update(farmId, recordId, dto);
  }

  async deleteVetRecord(farmId: string, recordId: string): Promise<void> {
    const existing = await this.vetRepository.findById(farmId, recordId);
    if (!existing) {
      const error: any = new Error('Vet treatment record not found.');
      error.statusCode = 404;
      error.code = 'VET_RECORD_NOT_FOUND';
      throw error;
    }

    return this.vetRepository.delete(farmId, recordId);
  }

  async getActiveWithdrawals(farmId: string): Promise<WithdrawalStatusInfo[]> {
    return this.vetRepository.listActiveWithdrawals(farmId);
  }

  async getAnimalWithdrawalStatus(farmId: string, animalId: string): Promise<WithdrawalStatusInfo | null> {
    return this.vetRepository.getWithdrawalStatusForAnimal(farmId, animalId);
  }
}
