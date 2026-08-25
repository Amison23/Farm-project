import { Router } from 'express';
import { AnimalController } from '../controllers/animalController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFarmMembership } from '../middleware/farmMembership.js';

const router = Router({ mergeParams: true });
const animalController = new AnimalController();

// All animal routes require authentication and farm membership
router.use(requireAuth);
router.use(requireFarmMembership());

// List animals & create animal
router.get('/', (req, res) => animalController.getAnimals(req, res));
router.post('/', requireFarmMembership(['owner']), (req, res) => animalController.createAnimal(req, res));

// Specific animal detail, edit, delete, and lineage
router.get('/:id', (req, res) => animalController.getAnimalById(req, res));
router.patch('/:id', requireFarmMembership(['owner']), (req, res) => animalController.updateAnimal(req, res));
router.delete('/:id', requireFarmMembership(['owner']), (req, res) => animalController.deleteAnimal(req, res));
router.get('/:id/lineage', (req, res) => animalController.getAnimalLineage(req, res));

export default router;
