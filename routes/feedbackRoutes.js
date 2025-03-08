import express from "express";
import {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import {
  protectRoute,
  verifyVerifiedUser,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/", createFeedback);
router.get("/", getFeedbacks);
router.get("/:id", getFeedbackById);

// Admin only routes
router.put("/:id", protectRoute, verifyVerifiedUser, updateFeedback);
router.delete("/:id", protectRoute, verifyVerifiedUser, deleteFeedback);

export default router;
