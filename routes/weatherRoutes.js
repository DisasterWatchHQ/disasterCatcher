import express from 'express';
import { 
  getCurrentLocationWeather,
  getSavedLocationWeather,
  saveLocation
} from '../controllers/weatherController.js';
import { protectRoute, verifyUserType } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protectRoute, verifyUserType(["admin"]));

router.get('/current', getCurrentLocationWeather);
router.get('/saved/:locationId', getSavedLocationWeather);
router.post('/locations', saveLocation);

export default router;
