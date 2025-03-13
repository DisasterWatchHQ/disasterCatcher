// routes/notificationRoutes.js
import express from "express";
import { notificationController } from "../controllers/notificationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Web push subscription routes
router.post("/web/subscribe", authenticate, notificationController.subscribeWebPush);
router.post("/web/unsubscribe", authenticate, notificationController.unsubscribeWebPush);
router.post("/web/subscribeweb", authenticate, notificationController.subscribe);
router.post("/web/unsubscribeweb", authenticate, notificationController.unsubscribe);
router.get("/web/subscriptions", authenticate, notificationController.getSubscriptions);

export default router;
