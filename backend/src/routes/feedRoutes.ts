import { Router } from 'express';
import { FeedController } from '../controllers/feedController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFarmMembership } from '../middleware/farmMembership.js';

const router = Router({ mergeParams: true });
const feedController = new FeedController();

router.use(requireAuth);
router.use(requireFarmMembership());

// GET /farms/:farmId/feed - List feed records
router.get('/', feedController.getFarmFeedRecords);

// POST /farms/:farmId/feed - Log new feed record
router.post('/', feedController.createFeedRecord);

// GET /farms/:farmId/feed/:id - Feed record details
router.get('/:id', feedController.getFeedRecordDetail);

// PATCH /farms/:farmId/feed/:id - Update feed record
router.patch('/:id', feedController.updateFeedRecord);

// DELETE /farms/:farmId/feed/:id - Delete feed record
router.delete('/:id', feedController.deleteFeedRecord);

export default router;
