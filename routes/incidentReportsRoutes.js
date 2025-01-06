import express from "express";
import {
  createIncidentReport,
  getIncidentReports,
  getNearbyIncidents,
  getIncidentReportById,
  updateIncidentReport,
  deleteIncidentReport,
} from "../controllers/incidentReportsController.js";
import {
  protectRoute,
  verifyVerifiedUser,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

router.post("/", verifyVerifiedUser, createIncidentReport);
router.put("/:id", verifyVerifiedUser, updateIncidentReport);
router.delete(
  "/:id",
  verifyVerifiedUser,
  deleteIncidentReport,
);

router.get("/", getIncidentReports);
router.get("/nearby", getNearbyIncidents);
router.get("/:id", getIncidentReportById);

export default router;
