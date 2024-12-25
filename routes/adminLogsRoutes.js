import express from "express";
import {
  getAdminLogs,
  getAdminLogById,
} from "../controllers/adminLogsController.js";
import {
  protectRoute,
  verifyUserType,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken, verifyUserType(["admin", "verified"]));

router.get("/", getAdminLogs);
router.get("/:id", getAdminLogById);

export default router;
