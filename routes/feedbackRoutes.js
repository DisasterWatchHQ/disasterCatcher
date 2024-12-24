import express from 'express';
import { 
  createFeedback, 
  getFeedbacks, 
  getFeedbackById, 
  updateFeedback, 
  deleteFeedback,
  getMyFeedback 
} from '../controllers/feedbackController.js';
import { protectRoute, verifyUserType, verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protectRoute, verifyToken);

router.post('/', createFeedback);
router.get('/my-feedback', getMyFeedback);

router.delete('/:id', verifyUserType(['admin']), deleteFeedback);
router.get('/:id', verifyUserType(['admin']), getFeedbackById);
router.get('/', verifyUserType(['admin']), getFeedbacks);
router.put('/:id', verifyUserType(['admin']), updateFeedback);

export default router;
