import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  authenticateUser,
  changePassword,
} from "../controllers/userController.js";
import { protectRoute, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", authenticateUser);
router.post("/register", createUser);

// All routes below this middleware require authentication
router.use(protectRoute, verifyToken);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/:id/changepassword", changePassword);

export default router;
