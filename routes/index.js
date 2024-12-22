import express from 'express';
import adminLogsRoutes from './adminLogsRoutes.js';
import userRoutes from './userRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import userReportRoutes from './userReportRoutes.js';
import incidentReportsRoutes from './incidentReportsRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import weatherRoutes from './weatherRoutes.js';
import alertsRoute from './alertsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import locationRoutes from './locationRoutes.js';

const router = express.Router();

router.use('/adminlogs', adminLogsRoutes);
router.use('/user', userRoutes);
router.use('/resource', resourceRoutes);
router.use('/userReport', userReportRoutes);
router.use('/incidentReport', incidentReportsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/weather', weatherRoutes);
router.use('/alerts',alertsRoute);
router.use('/notifications', notificationRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/location', locationRoutes);

export default router;