// routes/notificationRoutes.js
import express from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/subscribe', notificationController.subscribe);

export default router;