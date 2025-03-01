import express from "express";
import {
  getMyNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  removeNotification,
  registerPushToken
} from "../controllers/notificationController.js";
import { protectRoute, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

router.get("/my-notifications", getMyNotifications);
router.get("/:id", getNotificationById);
router.put("/:id/mark-read", markAsRead);
router.put("/mark-all-read", markAllAsRead);
router.delete("/:id", deleteNotification);
router.delete("/remove", removeNotification);
router.post("/register-push-token", protectRoute, verifyToken, registerPushToken);

export default router;
