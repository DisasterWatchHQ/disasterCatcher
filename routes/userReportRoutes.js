import express from 'express';
import { 
  createUserReport, 
  getUserReports, 
  getUserReportById, 
  updateUserReport, 
  deleteUserReport 
} from '../controllers/userReportController.js';
import { protectRoute, verifyUserType } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', verifyUserType(['user', 'admin']), createUserReport);
router.get('/', getUserReports);
router.get('/:id', getUserReportById);
router.put('/:id', verifyUserType(['user', 'admin']), updateUserReport);
router.delete('/:id', verifyUserType(['user', 'admin']), deleteUserReport);

export default router;
