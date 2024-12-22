import express from 'express';
import { 
  createAlert, 
  getAlerts, 
  getAlertById, 
  updateAlert, 
  deleteAlert 
} from '../controllers/alertsController.js';
import { protectRoute, verifyUserType } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.post('/', verifyUserType(["admin"]), createAlert);
router.get('/', verifyUserType(["admin"]), getAlerts);
router.get('/:id', verifyUserType(["admin"]), getAlertById);
router.put('/:id', verifyUserType(["admin"]), updateAlert);
router.delete('/:id', verifyUserType(["admin"]), deleteAlert);

export default router;
