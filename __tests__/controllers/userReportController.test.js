import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import UserReports from '../../models/userReports.js';
import User from '../../models/users.js';
import jwt from 'jsonwebtoken';

let mongoServer;
let testUser;
let adminUser;
let userToken;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test user with 'user' type
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    type: 'verified' // Changed from 'registered' to 'verified'
  });

  // Create admin user
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    type: 'admin'
  });

  userToken = jwt.sign(
    { userId: testUser._id, type: 'verified' }, // Updated type here
    process.env.JWT_SECRET
  );

  adminToken = jwt.sign(
    { userId: adminUser._id, type: 'admin' },
    process.env.JWT_SECRET
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await UserReports.deleteMany({});
});

describe('UserReport Controller', () => {
  const validReport = {
    title: 'Test Report',
    disaster_category: 'flood',
    description: 'Test description',
    location: {
      address: {
        city: 'Test City',
        district: 'Test District',
        province: 'Test Province'
      }
    }
  };

  describe('POST /api/userReport', () => {
    it('should create a new user report', async () => {
      const response = await request(app)
        .post('/api/userReport')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validReport);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(validReport.title);
      expect(response.body.status).toBe('pending');
    });

    it('should not create report with invalid disaster category', async () => {
      const invalidReport = {
        ...validReport,
        disaster_category: 'invalid'
      };

      const response = await request(app)
        .post('/api/userReport')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidReport);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/userReport', () => {
    beforeEach(async () => {
      await UserReports.create([
        {
          ...validReport,
          user_id: testUser._id,
          disaster_category: 'flood'
        },
        {
          ...validReport,
          title: 'Second Report',
          user_id: testUser._id,
          disaster_category: 'fire'
        }
      ]);
    });

    it('should get all reports with pagination', async () => {
      const response = await request(app)
        .get('/api/userReport')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reports).toBeDefined();
      expect(response.body.currentPage).toBe(1);
    });
  });

  describe('PUT /api/userReport/:id', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await UserReports.create({
        ...validReport,
        user_id: testUser._id
      });
    });

    it('should update report', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/userReport/${testReport._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updates.title);
    });

    it('should not allow unauthorized updates', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        type: 'verified'
      });

      const otherToken = jwt.sign(
        { userId: otherUser._id, type: 'verified' },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .put(`/api/userReport/${testReport._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/userReport/:id', () => {
    let testReport;

    beforeEach(async () => {
      testReport = await UserReports.create({
        ...validReport,
        user_id: testUser._id
      });
    });

    it('should allow owner to delete report', async () => {
      const response = await request(app)
        .delete(`/api/userReport/${testReport._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow admin to delete any report', async () => {
      const response = await request(app)
        .delete(`/api/userReport/${testReport._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});