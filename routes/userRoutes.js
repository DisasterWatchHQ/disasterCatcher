import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  authenticateUser,
  forgotPassword,
  resetPassword,
  updatePreferences,
  updatePushToken,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", createUser);
router.post("/login", authenticateUser);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);

// Protected routes
router.use(authenticate);

// User preferences and push token
router.patch("/preferences", updatePreferences);
router.patch("/push-token", updatePushToken);

// Admin only routes
router.use(authorize("official"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
