import { FeedRepository } from '../repositories/feedRepository.js';
import { AnimalRepository } from '../repositories/animalRepository.js';
import {
  FeedRecordWithAnimal,
  CreateFeedRecordDTO,
  UpdateFeedRecordDTO,
  FeedRecordQueryFilters,
} from '../types/feed.js';

export class FeedService {
  private feedRepository: FeedRepository;
  private animalRepository: AnimalRepository;

  constructor() {
    this.feedRepository = new FeedRepository();
    this.animalRepository = new AnimalRepository();
  }

  async getFarmFeedRecords(
    farmId: string,
    filters: FeedRecordQueryFilters
  ): Promise<{ data: FeedRecordWithAnimal[]; meta: { page: number; limit: number; total: number } }> {
    return this.feedRepository.findManyByFarmId(farmId, filters);
  }

  async getAnimalFeedHistory(farmId: string, animalId: string): Promise<FeedRecordWithAnimal[]> {
    const animal = await this.animalRepository.findById(farmId, animalId);
    if (!animal) {
      const error: any = new Error('Animal not found.');
      error.statusCode = 404;
      error.code = 'ANIMAL_NOT_FOUND';
      throw error;
    }
    return this.feedRepository.findByAnimalId(farmId, animalId);
  }

  async getFeedRecordDetail(farmId: string, id: string): Promise<FeedRecordWithAnimal> {
    const record = await this.feedRepository.findById(farmId, id);
    if (!record) {
      const error: any = new Error('Feed record not found.');
      error.statusCode = 404;
      error.code = 'RECORD_NOT_FOUND';
      throw error;
    }
    return record;
  }

  async createFeedRecord(
    farmId: string,
    userId: string,
    dto: CreateFeedRecordDTO
  ): Promise<FeedRecordWithAnimal> {
    if (!dto.animal_id) {
      const error: any = new Error('Animal ID is required.');
      error.statusCode = 400;
      error.code = 'MISSING_FIELD';
      throw error;
    }
    if (!dto.feed_date) {
      const error: any = new Error('Feed date is required.');
      error.statusCode = 400;
      error.code = 'MISSING_FIELD';
      throw error;
    }
    if (!dto.base || !dto.base.trim()) {
      const error: any = new Error('Base forage material is required.');
      error.statusCode = 400;
      error.code = 'MISSING_FIELD';
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

    return this.feedRepository.create(farmId, userId, dto);
  }

  async updateFeedRecord(
    farmId: string,
    id: string,
    dto: UpdateFeedRecordDTO
  ): Promise<FeedRecordWithAnimal> {
    const existing = await this.feedRepository.findById(farmId, id);
    if (!existing) {
      const error: any = new Error('Feed record not found.');
      error.statusCode = 404;
      error.code = 'RECORD_NOT_FOUND';
      throw error;
    }

    if (dto.animal_id) {
      const animal = await this.animalRepository.findById(farmId, dto.animal_id);
      if (!animal) {
        const error: any = new Error('Animal not found on this farm.');
        error.statusCode = 404;
        error.code = 'ANIMAL_NOT_FOUND';
        throw error;
      }
    }

    return this.feedRepository.update(farmId, id, dto);
  }

  async deleteFeedRecord(farmId: string, id: string): Promise<void> {
    const existing = await this.feedRepository.findById(farmId, id);
    if (!existing) {
      const error: any = new Error('Feed record not found.');
      error.statusCode = 404;
      error.code = 'RECORD_NOT_FOUND';
      throw error;
    }

    return this.feedRepository.delete(farmId, id);
  }
}
