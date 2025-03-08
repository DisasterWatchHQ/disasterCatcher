import express from "express";
import {
  createWarning,
  addWarningUpdate,
  addResponseAction,
  updateActionStatus,
  resolveWarning,
  getWarnings,
  getWarningById,
  getActiveWarnings,
  getWarningsByLocation,
  updateWarning
} from "../controllers/warningController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/active", getActiveWarnings);
router.get("/location", getWarningsByLocation);
router.get("/", getWarnings);
router.get("/:id", getWarningById);

// Protected routes
router.use(authenticate);
router.post("/", createWarning);
router.post("/:id/updates", addWarningUpdate);
router.post("/:id/resolve", resolveWarning);
router.post("/:id/actions", addResponseAction);
router.patch("/:id/actions/:actionId", updateActionStatus);
router.patch("/:id", updateWarning);

export default router;