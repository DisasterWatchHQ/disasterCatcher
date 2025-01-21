import express from "express";
import {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getMyFeedback,
} from "../controllers/feedbackController.js";
import {
  protectRoute,
  verifyVerifiedUser,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

router.post("/", createFeedback);
router.get("/my-feedback", getMyFeedback);

router.delete("/:id", verifyVerifiedUser, deleteFeedback);
router.get("/:id", verifyVerifiedUser, getFeedbackById);
router.get("/", verifyVerifiedUser, getFeedbacks);
router.put("/:id", verifyVerifiedUser, updateFeedback);

export default router;
