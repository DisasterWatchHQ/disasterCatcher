import express from 'express';
import { 
  getMyNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification 
} from '../controllers/notificationController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply protection middleware
router.use(protectRoute);

// Routes
router.get('/my-notifications', getMyNotifications);
router.get('/:id', getNotificationById);
router.put('/:id/mark-read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;