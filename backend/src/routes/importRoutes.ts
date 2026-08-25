import { Router } from 'express';
import multer from 'multer';
import { importController } from '../controllers/importController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFarmMembership } from '../middleware/farmMembership.js';

// Store incoming files in memory as buffers with a 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const router = Router({ mergeParams: true });

// Require Auth and farm owner access for imports
router.use(requireAuth);
router.use(requireFarmMembership(['owner']));

// POST /api/v1/farms/:farmId/import/preview
router.post('/preview', upload.single('file'), (req, res) => importController.preview(req, res));

// POST /api/v1/farms/:farmId/import/commit
router.post('/commit', upload.single('file'), (req, res) => importController.commit(req, res));

export default router;