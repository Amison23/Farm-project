import { Request, Response } from 'express';
import { AnimalService } from '../services/animalService.js';
import { AnimalSex, AnimalStatus } from '../types/animal.js';

export class AnimalController {
  private animalService: AnimalService;

  constructor() {
    this.animalService = new AnimalService();
  }

  /**
   * GET /farms/:farmId/animals
   */
  async getAnimals(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const { status, breed, sex, search, page, limit } = req.query;

      const filters = {
        status: status ? (status as AnimalStatus) : undefined,
        breed: breed ? (breed as string) : undefined,
        sex: sex ? (sex as AnimalSex) : undefined,
        search: search ? (search as string) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 25,
      };

      const result = await this.animalService.getAnimals(farmId, filters);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('[AnimalController.getAnimals] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch animals.',
        },
      });
    }
  }

  /**
   * GET /farms/:farmId/animals/:id
   */
  async getAnimalById(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const animalId = req.params.id as string;

      const animal = await this.animalService.getAnimalById(farmId, animalId);
      res.status(200).json({ data: animal });
    } catch (err: any) {
      console.error('[AnimalController.getAnimalById] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch animal details.',
        },
      });
    }
  }

  /**
   * POST /farms/:farmId/animals
   */
  async createAnimal(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const newAnimal = await this.animalService.createAnimal(farmId, req.body);
      res.status(201).json({ data: newAnimal });
    } catch (err: any) {
      console.error('[AnimalController.createAnimal] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to create animal.',
        },
      });
    }
  }

  /**
   * PATCH /farms/:farmId/animals/:id
   */
  async updateAnimal(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const animalId = req.params.id as string;
      const { override, override_reason, ...dto } = req.body;
      const userId = res.locals.userId as string;

      const updatedAnimal = await this.animalService.updateAnimal(farmId, animalId, dto, {
        override,
        override_reason,
        userId,
      });
      res.status(200).json({ data: updatedAnimal });
    } catch (err: any) {
      console.error('[AnimalController.updateAnimal] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to update animal.',
          detail: err.detail || undefined,
        },
      });
    }
  }

  /**
   * DELETE /farms/:farmId/animals/:id
   */
  async deleteAnimal(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const animalId = req.params.id as string;

      await this.animalService.deleteAnimal(farmId, animalId);
      res.status(200).json({ message: 'Animal successfully deleted.' });
    } catch (err: any) {
      console.error('[AnimalController.deleteAnimal] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to delete animal.',
        },
      });
    }
  }

  /**
   * GET /farms/:farmId/animals/:id/lineage
   */
  async getAnimalLineage(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const animalId = req.params.id as string;

      const lineage = await this.animalService.getAnimalLineage(farmId, animalId);
      res.status(200).json({ data: lineage });
    } catch (err: any) {
      console.error('[AnimalController.getAnimalLineage] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch animal lineage.',
        },
      });
    }
  }
}
