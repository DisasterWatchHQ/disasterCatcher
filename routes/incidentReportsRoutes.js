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
  verifyUserType,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

router.post("/", verifyUserType(["admin", "verified"]), createIncidentReport);
router.put("/:id", verifyUserType(["admin", "verified"]), updateIncidentReport);
router.delete(
  "/:id",
  verifyUserType(["admin", "verified"]),
  deleteIncidentReport,
);

router.get("/", getIncidentReports);
router.get("/nearby", getNearbyIncidents);
router.get("/:id", getIncidentReportById);

export default router;
