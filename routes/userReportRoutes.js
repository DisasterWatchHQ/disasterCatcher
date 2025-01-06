import express from "express";
import {
  createUserReport,
  getUserReports,
  getUserReportById,
  updateUserReport,
  deleteUserReport,
} from "../controllers/userReportController.js";
import {
  protectRoute,
  verifyVerifiedUser,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", createUserReport);

router.use(protectRoute, verifyToken);

router.get("/", getUserReports);
router.get("/:id", getUserReportById);
router.put("/:id", verifyVerifiedUser, updateUserReport);
router.delete("/:id", verifyVerifiedUser, deleteUserReport);

export default router;
