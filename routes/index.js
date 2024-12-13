import express from 'express';
import adminLogsRoutes from './adminLogsRoutes.js';
import userRoutes from './userRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import userReportRoutes from './userReportRoutes.js';
import incidentReportsRoutes from './incidentReportsRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import weatherRoutes from './weatherRoutes.js';

const router = express.Router();

router.use('/adminlogs', adminLogsRoutes);
router.use('/user', userRoutes);
router.use('/resource', resourceRoutes);
router.use('/userReport', userReportRoutes);
router.use('/incidentReport', incidentReportsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/weather', weatherRoutes);

export default router;