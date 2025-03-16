import express from "express";
import {
  createUserReport,
  verifyReport,
  dismissReport,
  getUserReports,
  getReportsByUser,
  getReportStats,
  getVerificationStats,
  getReportAnalytics,
  getPublicFeed,
  getFeedReports,
  getFeedStats,
  getFeedUpdates,
} from "../controllers/userReportController.js";
import { protectRoute, verifyVerifiedUser, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/feed", getPublicFeed);
router.post("/", createUserReport);
router.get("/public", getUserReports);
router.get("/reports", getFeedReports);
router.get("/feedstats", getFeedStats);
router.get("/updates", getFeedUpdates);

router.use(protectRoute, verifyToken);

router.get("/my-reports", getReportsByUser);
router.get("/stats/verification", getVerificationStats);
router.get("/stats/analytics", getReportAnalytics);

router.post("/:id/verify", verifyReport);
router.post("/:id/dismiss", dismissReport);

router.get("/stats", getReportStats);
router.get("/verified", getUserReports);

export default router;
