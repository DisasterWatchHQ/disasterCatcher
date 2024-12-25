import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import Subscription from '../../models/subscriptions.js';
import User from '../../models/users.js';
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
    type: 'registered',
    verification_status: true
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
  await Subscription.deleteMany({});
});

describe('Subscription Controller', () => {
  const validSubscriptionData = {
    disaster_types: ['flood', 'earthquake'],
    regions: ['Colombo', 'Kandy'],
    notification_frequency: 'instant'
  };

  describe('POST /api/subscriptions', () => {
    it('should create a new subscription', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validSubscriptionData);

      expect(response.status).toBe(201);
      expect(response.body.disaster_types).toEqual(expect.arrayContaining(['flood', 'earthquake']));
      expect(response.body.regions).toEqual(expect.arrayContaining(['Colombo', 'Kandy']));
    });

    it('should not allow duplicate subscriptions for same user', async () => {
      await Subscription.create({
        ...validSubscriptionData,
        user_id: testUser._id
      });

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validSubscriptionData);

      expect(response.status).toBe(400);
    });

    it('should validate disaster types', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validSubscriptionData,
          disaster_types: ['invalid_type']
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/subscriptions/my-subscription', () => {
    it('should get user subscription', async () => {
      await Subscription.create({
        ...validSubscriptionData,
        user_id: testUser._id
      });

      const response = await request(app)
        .get('/api/subscriptions/my-subscription')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user_id).toBe(testUser._id.toString());
    });

    it('should return 404 if no subscription exists', async () => {
      const response = await request(app)
        .get('/api/subscriptions/my-subscription')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/subscriptions/my-subscription', () => {
    let testSubscription;

    beforeEach(async () => {
      testSubscription = await Subscription.create({
        ...validSubscriptionData,
        user_id: testUser._id
      });
    });

    it('should update subscription', async () => {
      const updateData = {
        notification_frequency: 'weekly',
        regions: ['Galle']
      };

      const response = await request(app)
        .put('/api/subscriptions/my-subscription')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.notification_frequency).toBe('weekly');
      expect(response.body.regions).toEqual(['Galle']);
    });

    it('should validate updated data', async () => {
      const response = await request(app)
        .put('/api/subscriptions/my-subscription')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          notification_frequency: 'invalid'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/subscriptions/my-subscription', () => {
    it('should delete subscription', async () => {
      await Subscription.create({
        ...validSubscriptionData,
        user_id: testUser._id
      });

      const response = await request(app)
        .delete('/api/subscriptions/my-subscription')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      
      const deletedSubscription = await Subscription.findOne({ user_id: testUser._id });
      expect(deletedSubscription).toBeNull();
    });

    it('should return 404 if no subscription exists', async () => {
      const response = await request(app)
        .delete('/api/subscriptions/my-subscription')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });
});