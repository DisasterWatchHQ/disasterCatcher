import express from "express";
import userRoutes from "./userRoutes.js";
import resourceRoutes from "./resourceRoutes.js";
import userReportRoutes from "./userReportRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import warningRoutes from "./warningRoutes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/resources", resourceRoutes);
router.use("/reports", userReportRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/notifications", notificationRoutes);
router.use("/warnings", warningRoutes);

export default router;
