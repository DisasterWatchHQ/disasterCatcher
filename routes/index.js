import express from "express";
import adminLogsRoutes from "./adminLogsRoutes.js";
import userRoutes from "./userRoutes.js";
import resourceRoutes from "./resourceRoutes.js";
import userReportRoutes from "./userReportRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";
import alertsRoute from "./alertsRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import locationRoutes from "./locationRoutes.js";
import warningRoutes from "./warningRoutes.js";

const router = express.Router();

router.use("/adminlogs", adminLogsRoutes);
router.use("/user", userRoutes);
router.use("/resources", resourceRoutes);
router.use("/userReport", userReportRoutes);

router.use("/feedback", feedbackRoutes);

// router.use("/alerts", alertsRoute);
router.use("/notifications", notificationRoutes);
// router.use("/location", locationRoutes);

router.use("/warning", warningRoutes);

export default router;
