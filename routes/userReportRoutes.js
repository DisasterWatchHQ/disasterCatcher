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
  verifyUserType,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

router.post("/", verifyUserType(["user", "verified"]), createUserReport);
router.get("/", getUserReports);
router.get("/:id", getUserReportById);
router.put("/:id", verifyUserType(["user", "verified"]), updateUserReport);
router.delete(
  "/:id",
  verifyUserType(["user", "admin", "verified"]),
  deleteUserReport,
);

export default router;
