import express from "express";
import {
  createResource,
  getFacilities,
  getGuides,
  getEmergencyContacts,
  getNearbyFacilities,
  getResourceById,
  updateResource,
  deleteResource,
} from "../controllers/resourceController.js";
import {
  protectRoute,
  verifyUserType,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken);

// Public routes
router.get("/facilities", getFacilities);
router.get("/guides", getGuides);
router.get("/emergency-contacts", getEmergencyContacts);
router.get("/facilities/nearby", getNearbyFacilities);
router.get("/:id", getResourceById);

// Protected routes
router.post("/", verifyUserType(["admin", "verified"]), createResource);
router.put("/:id", verifyUserType(["admin", "verified"]), updateResource);
router.delete("/:id", verifyUserType(["admin", "verified"]), deleteResource);

export default router;
