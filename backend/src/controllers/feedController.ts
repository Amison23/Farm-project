import { Request, Response } from 'express';
import { FeedService } from '../services/feedService.js';
import { FeedRecordQueryFilters } from '../types/feed.js';

export class FeedController {
  private feedService: FeedService;

  constructor() {
    this.feedService = new FeedService();
  }

  getFarmFeedRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const { farmId } = req.params;
      const { animal_id, search, startDate, endDate, page, limit } = req.query;

      const filters: FeedRecordQueryFilters = {
        animal_id: animal_id ? String(animal_id) : undefined,
        search: search ? String(search) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        page: page ? parseInt(String(page), 10) : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
      };

      const result = await this.feedService.getFarmFeedRecords(farmId as string, filters);
      res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Failed to fetch feed records.',
        status: statusCode,
      });
    }
  };

  getAnimalFeedHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { farmId, animalId } = req.params;
      const data = await this.feedService.getAnimalFeedHistory(farmId as string, animalId as string);
      res.status(200).json(data);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Failed to fetch animal feed history.',
        status: statusCode,
      });
    }
  };

  getFeedRecordDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { farmId, id } = req.params;
      const data = await this.feedService.getFeedRecordDetail(farmId as string, id as any);
      res.status(200).json(data);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Failed to fetch feed record details.',
        status: statusCode,
      });
    }
  };

  createFeedRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const farmId = (req.params.farmId || res.locals.farmId) as string;
      const userId = (res.locals.userId || (req as any).user?.id) as string;
      if (!userId) {
        res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not authenticated.', status: 401 });
        return;
      }

      const data = await this.feedService.createFeedRecord(farmId as string, userId, req.body);
      res.status(201).json(data);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Failed to create feed record.',
        status: statusCode,
      });
    }
  };

  updateFeedRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { farmId, id } = req.params;
      const data = await this.feedService.updateFeedRecord(farmId as string, id as any, req.body);
      res.status(200).json(data);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Failed to update feed record.',
        status: statusCode,
      });
    }
  };

  deleteFeedRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { farmId, id } = req.params;
      await this.feedService.deleteFeedRecord(farmId as string, id as any);
      res.status(204).send();
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Failed to delete feed record.',
        status: statusCode,
      });
    }
  };
}
