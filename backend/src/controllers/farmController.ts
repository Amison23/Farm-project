import { Request, Response } from 'express';
import { FarmService } from '../services/farmService.js';

const farmService = new FarmService();

export class FarmController {
  async getUserFarms(req: Request, res: Response): Promise<void> {
    try {
      const userId = res.locals.userId as string;
      const farms = await farmService.getUserFarms(userId);
      res.status(200).json({ data: farms });
    } catch (err: any) {
      console.error('[FarmController.getUserFarms] Error:', err);
      res.status(err.statusCode || 500).json({
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to fetch farms.' }
      });
    }
  }

  async createFarm(req: Request, res: Response): Promise<void> {
    try {
      const userId = res.locals.userId as string;
      const farm = await farmService.createFarm(req.body, userId);
      res.status(201).json({ data: farm });
    } catch (err: any) {
      console.error('[FarmController.createFarm] Error:', err);
      res.status(err.statusCode || 500).json({
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to create farm.' }
      });
    }
  }

  async getFarmById(req: Request, res: Response): Promise<void> {
    try {
      const farmId = req.params.id as string;
      const farm = await farmService.getFarmById(farmId);
      res.status(200).json({ data: farm });
    } catch (err: any) {
      console.error('[FarmController.getFarmById] Error:', err);
      res.status(err.statusCode || 500).json({
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to fetch farm.' }
      });
    }
  }

  async updateFarm(req: Request, res: Response): Promise<void> {
    try {
      const farmId = req.params.id as string;
      const farm = await farmService.updateFarm(farmId, req.body);
      res.status(200).json({ data: farm });
    } catch (err: any) {
      console.error('[FarmController.updateFarm] Error:', err);
      res.status(err.statusCode || 500).json({
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to update farm.' }
      });
    }
  }

  async getFarmMembers(req: Request, res: Response): Promise<void> {
    try {
      const farmId = req.params.id as string;
      const members = await farmService.getFarmMembers(farmId);
      res.status(200).json({ data: members });
    } catch (err: any) {
      console.error('[FarmController.getFarmMembers] Error:', err);
      res.status(err.statusCode || 500).json({
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to fetch farm members.' }
      });
    }
  }

  async inviteMember(req: Request, res: Response): Promise<void> {
    try {
      const farmId = req.params.id as string;
      const { email, role } = req.body;
      const member = await farmService.inviteMemberByEmail(farmId, email, role || 'vet');
      res.status(201).json({ data: member });
    } catch (err: any) {
      console.error('[FarmController.inviteMember] Error:', err);
      res.status(err.statusCode || 500).json({
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to invite member.' }
      });
    }
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const farmId = req.params.id as string;
      const targetUserId = req.params.userId as string;
      const requestingUserId = res.locals.userId as string;
      await farmService.removeMember(farmId, targetUserId, requestingUserId);
      res.status(200).json({ data: { success: true } });
    } catch (err: any) {
      console.error('[FarmController.removeMember] Error:', err);
      res.status(err.statusCode || 500).json({
        error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Failed to remove member.' }
      });
    }
  }
}
