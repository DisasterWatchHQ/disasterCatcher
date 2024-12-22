import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import Notification from '../../models/notifications.js';
import User from '../../models/users.js';
import { createSystemNotification, createAlertNotification } from '../../controllers/notificationController.js';
import jwt from 'jsonwebtoken';

let mongoServer;
let testUser;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    type: 'registered'
  });

  userToken = jwt.sign(
    { userId: testUser._id },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Notification.deleteMany({});
});

describe('Notification System', () => {
  describe('System Notification Creation', () => {
    it('should create a system notification', async () => {
      const notification = await createSystemNotification(
        testUser._id,
        'System update notification',
        'system_update'
      );

      expect(notification).toBeTruthy();
      expect(notification.type).toBe('system_update');
      expect(notification.source).toBe('system');
    });

    it('should create an alert notification', async () => {
      const alertData = {
        message: 'Flood warning in your area',
        priority: 'high',
        disaster_type: 'flood',
        area: 'Test Area'
      };

      const notification = await createAlertNotification(testUser._id, alertData);

      expect(notification).toBeTruthy();
      expect(notification.type).toBe('alert');
      expect(notification.priority).toBe('high');
      expect(notification.metadata.get('disaster_type')).toBe('flood');
    });
  });

  describe('GET /api/notifications/my-notifications', () => {
    beforeEach(async () => {
      await createSystemNotification(
        testUser._id,
        'Test notification 1',
        'system_update'
      );
      await createSystemNotification(
        testUser._id,
        'Test notification 2',
        'alert'
      );
    });

    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications/my-notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].status).toBe('unread');
    });
  });

  describe('PUT /api/notifications/:id/mark-read', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await createSystemNotification(
        testUser._id,
        'Test notification',
        'system_update'
      );
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('read');
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    beforeEach(async () => {
      await Promise.all([
        createSystemNotification(testUser._id, 'Test 1', 'system_update'),
        createSystemNotification(testUser._id, 'Test 2', 'alert')
      ]);
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      
      const notifications = await Notification.find({ user_id: testUser._id });
      expect(notifications.every(n => n.status === 'read')).toBe(true);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await createSystemNotification(
        testUser._id,
        'Test notification',
        'system_update'
      );
    });

    it('should delete notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      
      const deletedNotification = await Notification.findById(testNotification._id);
      expect(deletedNotification).toBeNull();
    });
  });
});