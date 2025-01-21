import express from "express";
import {
  createWarning,
  addWarningUpdate,
  addResponseAction,
  updateActionStatus,
  resolveWarning,
  getWarnings,
  getWarningById,
  getActiveWarnings
} from "../controllers/warningController.js";
import {
  protectRoute,
  verifyVerifiedUser,
  verifyToken
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/active", getActiveWarnings);
router.get("/", getWarnings);
router.get("/:id", getWarningById);

// Protected routes - require authentication
router.use(protectRoute, verifyToken);

// Routes for verified users only
router.use(verifyVerifiedUser);
router.post("/", createWarning);
router.post("/:id/updates", addWarningUpdate);
router.post("/:id/actions", addResponseAction);
router.patch("/:id/actions/:actionId", updateActionStatus);
router.post("/:id/resolve", resolveWarning);

export default router;