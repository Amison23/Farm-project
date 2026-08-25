import { Router } from 'express';
import { VetController } from '../controllers/vetController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFarmMembership } from '../middleware/farmMembership.js';

const router = Router({ mergeParams: true });
const vetController = new VetController();

// All vet routes require authentication and farm membership
router.use(requireAuth);
router.use(requireFarmMembership());

// Withdrawal status overview
router.get('/withdrawal-status', (req, res) => vetController.getActiveWithdrawals(req, res));

// List & Create vet records (Owners and Vets can write)
router.get('/', (req, res) => vetController.getVetRecords(req, res));
router.post('/', requireFarmMembership(['owner', 'vet']), (req, res) => vetController.createVetRecord(req, res));

// Detail, update, and delete
router.get('/:id', (req, res) => vetController.getVetRecordById(req, res));
router.patch('/:id', requireFarmMembership(['owner', 'vet']), (req, res) => vetController.updateVetRecord(req, res));
router.delete('/:id', requireFarmMembership(['owner']), (req, res) => vetController.deleteVetRecord(req, res));

export default router;
