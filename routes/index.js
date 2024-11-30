import express from 'express';
import adminLogsRoutes from './adminLogsRoutes.js';

const router = express.Router();

router.use('/adminLogs', adminLogsRoutes);

export default router;