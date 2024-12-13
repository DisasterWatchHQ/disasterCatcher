import express from 'express';
import adminLogsRoutes from './adminLogsRoutes.js';
import userRoutes from './userRoutes.js';
import resourceRoutes from './resourceRoutes.js';

const router = express.Router();

router.use('/adminlogs', adminLogsRoutes);
router.use('/user', userRoutes);
router.use('/resource', resourceRoutes);

export default router;