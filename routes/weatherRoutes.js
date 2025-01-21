import express from "express";
import {
  getCurrentLocationWeather,
  getSavedLocationWeather,
  saveLocation,
} from "../controllers/weatherController.js";
import {
  protectRoute,
  verifyVerifiedUser,
  verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectRoute, verifyToken, verifyVerifiedUser);

router.get("/current", getCurrentLocationWeather);
router.get("/saved/:locationId", getSavedLocationWeather);
router.post("/locations", saveLocation);

export default router;
