import express from "express";
import {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
} from "../controllers/alertsController.js";
import {
  protectRoute,
  verifyVerifiedUser,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

router.post("/", verifyVerifiedUser, createAlert);
router.get("/", verifyVerifiedUser, getAlerts);
router.get("/:id", verifyVerifiedUser, getAlertById);
router.put("/:id",verifyVerifiedUser, updateAlert);
router.delete("/:id", verifyVerifiedUser, deleteAlert);

export default router;
