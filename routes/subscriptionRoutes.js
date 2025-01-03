import express from "express";
import {
  createSubscription,
  getMySubscription,
  updateMySubscription,
  deleteMySubscription,
} from "../controllers/subscriptionController.js";
import { protectRoute, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

router.post("/", createSubscription);
router.get("/my-subscription", getMySubscription);
router.put("/my-subscription", updateMySubscription);
router.delete("/my-subscription", deleteMySubscription);

export default router;
