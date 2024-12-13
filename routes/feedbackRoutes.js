import express from 'express';
import { 
  createFeedback, 
  getFeedbacks, 
  getFeedbackById, 
  updateFeedback, 
  deleteFeedback,
  getMyFeedback 
} from '../controllers/feedbackController.js';
import { protectRoute, verifyUserType } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', createFeedback);
router.get('/my-feedback', getMyFeedback);
router.get('/:id', getFeedbackById);
router.delete('/:id', deleteFeedback);

router.get('/', verifyUserType(['admin']), getFeedbacks);
router.put('/:id', verifyUserType(['admin']), updateFeedback);

export default router;
