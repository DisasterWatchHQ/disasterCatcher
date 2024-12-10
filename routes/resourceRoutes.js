import express from 'express';
import { 
  createResource, 
  getResources, 
  getNearbyResources,
  getResourceById, 
  updateResource, 
  deleteResource 
} from '../controllers/resourceController.js';
import { protectRoute, verifyUserType } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', verifyUserType(['admin', 'manager']), createResource);

router.get('/', getResources);
router.get('/nearby', getNearbyResources);
router.get('/:id', getResourceById);

router.put('/:id', verifyUserType(['admin', 'manager']), updateResource);

router.delete('/:id', verifyUserType(['admin', 'manager']), deleteResource);

export default router;
