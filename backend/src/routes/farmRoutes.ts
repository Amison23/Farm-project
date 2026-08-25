import { Router } from 'express';
import { FarmController } from '../controllers/farmController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFarmMembership } from '../middleware/farmMembership.js';

const router = Router();
const farmController = new FarmController();

// All farm routes require authentication
router.use(requireAuth);

// User's farm list and creation
router.get('/', (req, res) => farmController.getUserFarms(req, res));
router.post('/', (req, res) => farmController.createFarm(req, res));

// Farm-specific routes (guarded by farm membership)
router.get('/:id', requireFarmMembership(), (req, res) => farmController.getFarmById(req, res));
router.patch('/:id', requireFarmMembership(['owner']), (req, res) => farmController.updateFarm(req, res));

// Farm membership management
router.get('/:id/members', requireFarmMembership(), (req, res) => farmController.getFarmMembers(req, res));
router.post('/:id/members', requireFarmMembership(['owner']), (req, res) => farmController.inviteMember(req, res));
router.delete('/:id/members/:userId', requireFarmMembership(['owner']), (req, res) => farmController.removeMember(req, res));

export default router;
