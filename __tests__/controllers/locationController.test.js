import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import Location from '../../models/location.js';
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

  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    type: 'registered',
    verification_status: true
  });

  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    type: 'admin',
    verification_status: true
  });

  userToken = jwt.sign(
    { userId: testUser._id },
    process.env.JWT_SECRET || 'test-secret'
  );

  adminToken = jwt.sign(
    { userId: adminUser._id },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Location.deleteMany({});
});

describe('Location Controller', () => {
  const validLocationData = {
    current_location: 'Test Location',
    address: '123 Test Street, Test City',
    latitude: 6.927079,
    longitude: 79.861244,
    geohash: 'testgeohash123'
  };

  describe('POST /api/location', () => {
    it('should create a new location', async () => {
      const response = await request(app)
        .post('/api/location')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validLocationData);

      expect(response.status).toBe(201);
      expect(response.body.current_location).toBe(validLocationData.current_location);
      expect(response.body.latitude).toBe(validLocationData.latitude);
      expect(response.body.longitude).toBe(validLocationData.longitude);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        current_location: 'Test Location'
      };

      const response = await request(app)
        .post('/api/location')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should validate coordinate ranges', async () => {
      const invalidData = {
        ...validLocationData,
        latitude: 91
      };

      const response = await request(app)
        .post('/api/location')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/location', () => {
    beforeEach(async () => {
      await Location.create([
        validLocationData,
        {
          current_location: 'Second Location',
          address: '456 Test Avenue',
          latitude: 6.927080,
          longitude: 79.861245,
          geohash: 'testgeohash456'
        }
      ]);
    });

    it('should get all locations', async () => {
      const response = await request(app)
        .get('/api/location')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/location/:id', () => {
    let testLocation;

    beforeEach(async () => {
      testLocation = await Location.create(validLocationData);
    });

    it('should get location by id', async () => {
      const response = await request(app)
        .get(`/api/location/${testLocation._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.current_location).toBe(validLocationData.current_location);
    });

    it('should return 404 for non-existent location', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/location/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/location/:id', () => {
    let testLocation;

    beforeEach(async () => {
      testLocation = await Location.create(validLocationData);
    });

    it('should update location', async () => {
      const updateData = {
        current_location: 'Updated Location',
        address: 'Updated Address'
      };

      const response = await request(app)
        .put(`/api/location/${testLocation._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.current_location).toBe(updateData.current_location);
    });
  });

  describe('DELETE /api/location/:id', () => {
    let testLocation;

    beforeEach(async () => {
      testLocation = await Location.create(validLocationData);
    });

    it('should delete location', async () => {
      const response = await request(app)
        .delete(`/api/location/${testLocation._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const deletedLocation = await Location.findById(testLocation._id);
      expect(deletedLocation).toBeNull();
    });
  });
});