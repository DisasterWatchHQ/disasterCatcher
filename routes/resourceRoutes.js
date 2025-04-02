import express from "express";
import {
  createResource,
  getFacilities,
  getGuides,
  getEmergencyContacts,
  getResourceById,
  updateResource,
  deleteResource,
} from "../controllers/resourceController.js";
import { protectRoute, verifyVerifiedUser, verifyToken } from "../middlewares/authMiddleware.js";
import Resource from "../models/resources.js";

const router = express.Router();

router.get("/facilities", getFacilities);
router.get("/guides", getGuides);
router.get("/emergency-contacts", getEmergencyContacts);
router.get("/:id", getResourceById);

router.use(protectRoute, verifyToken);

router.post("/", createResource);
router.put("/:id", updateResource);
router.delete("/:id", deleteResource);

router.get("/verified/last-month", async (req, res) => {
  const oneMonthAgo = new Date();

  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const resources = await Resource.find({
    last_verified: { $gte: oneMonthAgo },
  }).populate("added_by", "name email");

  res.json({ success: true, data: resources });
});

router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate("added_by", "name email")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
export default router;
