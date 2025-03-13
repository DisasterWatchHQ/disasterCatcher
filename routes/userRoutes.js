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
  updateAvatar,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Public routes
router.post("/register", createUser);
router.post("/login", authenticateUser);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);

// Protected routes
router.use(authenticate);

// User profile routes (users can access their own profile)
router.get("/me", getUserById);
router.patch("/me", updateUser);
router.delete("/me", deleteUser);

// User preferences and push token
router.patch("/me/preferences", updatePreferences);
router.patch("/me/push-token", updatePushToken);

// Avatar upload route
router.post("/me/avatar", upload.single('avatar'), updateAvatar);

// Admin only routes
router.use(authorize("official"));
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
