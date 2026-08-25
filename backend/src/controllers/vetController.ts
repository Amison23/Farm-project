import { Request, Response } from 'express';
import { VetService } from '../services/vetService.js';

export class VetController {
  private vetService: VetService;

  constructor() {
    this.vetService = new VetService();
  }

  /**
   * GET /farms/:farmId/vet-records
   */
  async getVetRecords(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const { animal_id, from, to, search, page, limit } = req.query;

      const filters = {
        animal_id: animal_id ? (animal_id as string) : undefined,
        from: from ? (from as string) : undefined,
        to: to ? (to as string) : undefined,
        search: search ? (search as string) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 25,
      };

      const result = await this.vetService.getVetRecords(farmId, filters);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('[VetController.getVetRecords] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch vet treatment records.',
        },
      });
    }
  }

  /**
   * GET /farms/:farmId/vet-records/withdrawal-status
   */
  async getActiveWithdrawals(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const activeWithdrawals = await this.vetService.getActiveWithdrawals(farmId);
      res.status(200).json({ data: activeWithdrawals });
    } catch (err: any) {
      console.error('[VetController.getActiveWithdrawals] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch withdrawal status list.',
        },
      });
    }
  }

  /**
   * GET /farms/:farmId/vet-records/:id
   */
  async getVetRecordById(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const recordId = req.params.id as string;

      const record = await this.vetService.getVetRecordById(farmId, recordId);
      res.status(200).json({ data: record });
    } catch (err: any) {
      console.error('[VetController.getVetRecordById] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to fetch vet record details.',
        },
      });
    }
  }

  /**
   * POST /farms/:farmId/vet-records
   */
  async createVetRecord(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const userId = res.locals.userId as string;

      const newRecord = await this.vetService.createVetRecord(farmId, userId, req.body);
      res.status(201).json({ data: newRecord });
    } catch (err: any) {
      console.error('[VetController.createVetRecord] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to create vet treatment record.',
        },
      });
    }
  }

  /**
   * PATCH /farms/:farmId/vet-records/:id
   */
  async updateVetRecord(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const recordId = req.params.id as string;

      const updatedRecord = await this.vetService.updateVetRecord(farmId, recordId, req.body);
      res.status(200).json({ data: updatedRecord });
    } catch (err: any) {
      console.error('[VetController.updateVetRecord] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to update vet record.',
        },
      });
    }
  }

  /**
   * DELETE /farms/:farmId/vet-records/:id
   */
  async deleteVetRecord(req: Request, res: Response): Promise<void> {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const recordId = req.params.id as string;

      await this.vetService.deleteVetRecord(farmId, recordId);
      res.status(200).json({ message: 'Vet treatment record successfully deleted.' });
    } catch (err: any) {
      console.error('[VetController.deleteVetRecord] Error:', err);
      res.status(err.statusCode || 500).json({
        error: {
          code: err.code || 'INTERNAL_ERROR',
          message: err.message || 'Failed to delete vet record.',
        },
      });
    }
  }
}
