import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import Alert from '../../models/alerts.js';
import User from '../../models/users.js';
import jwt from 'jsonwebtoken';

let mongoServer;
let adminToken;
let adminUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create admin user
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    type: 'admin'
  });

  adminToken = jwt.sign(
    { userId: adminUser._id, type: 'admin' },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Alert.deleteMany({});
});

describe('Alerts Controller', () => {
  const validAlertData = {
    alert_type: 'warning',
    disaster: 'flood',
    distance: 10,
    time: new Date().toISOString(),
    priority: 'high'
  };

  describe('POST /api/alerts', () => {
    it('should create new alert when admin', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validAlertData);

      expect(response.status).toBe(201);
      expect(response.body.alert_type).toBe(validAlertData.alert_type);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        ...validAlertData,
        alert_type: 'invalid'
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/alerts', () => {
    beforeEach(async () => {
      await Alert.create([
        validAlertData,
        {
          ...validAlertData,
          disaster: 'earthquake',
          priority: 'medium'
        }
      ]);
    });

    it('should get all alerts', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/alerts/:id', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = await Alert.create(validAlertData);
    });

    it('should get alert by id', async () => {
      const response = await request(app)
        .get(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.disaster).toBe(testAlert.disaster);
    });

    it('should return 404 for non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/alerts/:id', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = await Alert.create(validAlertData);
    });

    it('should update alert', async () => {
      const updates = {
        priority: 'medium',
        distance: 20
      };

      const response = await request(app)
        .put(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe(updates.priority);
      expect(response.body.distance).toBe(updates.distance);
    });

    it('should fail with invalid update data', async () => {
      const response = await request(app)
        .put(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ priority: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = await Alert.create(validAlertData);
    });

    it('should delete alert', async () => {
      const response = await request(app)
        .delete(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const deletedAlert = await Alert.findById(testAlert._id);
      expect(deletedAlert).toBeNull();
    });

    it('should return 404 for non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Authorization Tests', () => {
    let nonAdminToken;

    beforeAll(async () => {
      const regularUser = await User.create({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'password123',
        type: 'registered'
      });

      nonAdminToken = jwt.sign(
        { userId: regularUser._id, type: 'registered' },
        process.env.JWT_SECRET || 'test-secret'
      );
    });

    it('should prevent non-admin from creating alert', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(validAlertData);

      expect(response.status).toBe(403);
    });
  });
});