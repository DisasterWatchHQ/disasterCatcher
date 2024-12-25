import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import Resource from '../../models/resources.js';
import User from '../../models/users.js';
import jwt from 'jsonwebtoken';

let mongoServer;
let adminUser;
let verifiedUser;
let regularUser;
let adminToken;
let verifiedToken;
let regularToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test users
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    type: 'admin',
    verification_status: true
  });

  verifiedUser = await User.create({
    name: 'Verified User',
    email: 'verified@test.com',
    password: 'verified123',
    type: 'verified',
    verification_status: true
  });

  regularUser = await User.create({
    name: 'Regular User',
    email: 'regular@test.com',
    password: 'regular123',
    type: 'registered'
  });

  adminToken = jwt.sign(
    { userId: adminUser._id, type: 'admin' },
    process.env.JWT_SECRET || 'test-secret'
  );

  verifiedToken = jwt.sign(
    { userId: verifiedUser._id, type: 'verified' },
    process.env.JWT_SECRET || 'test-secret'
  );

  regularToken = jwt.sign(
    { userId: regularUser._id, type: 'registered' },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Resource.deleteMany({});
});

describe('Resource Controller', () => {
  const facilityData = {
    name: 'Test Hospital',
    category: 'facility',
    type: 'hospital',
    location: {
      type: 'point',
      longitude: 80.2389,
      latitude: 6.0535,
      address: {
        formatted_address: '123 Test Street',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        details: 'Near landmark'
      }
    },
    contact: {
      phone: '1234567890',
      email: 'test@hospital.com'
    },
    availability_status: 'open'
  };

  const guideData = {
    name: 'Flood Safety Guide',
    category: 'guide',
    type: 'disaster_guide',
    description: 'Safety guidelines for floods',
    content: 'Detailed safety instructions...',
    contact: {
      phone: '911',
      email: 'emergency@gov.lk'
    }
  };

  const emergencyContactData = {
    name: 'Emergency Hotline',
    category: 'emergency_contact',
    type: 'emergency_number',
    contact: {
      phone: '119',
      email: 'emergency@police.gov.lk'
    }
  };

  describe('POST /api/resource', () => {
    it('should create a facility resource', async () => {
      const response = await request(app)
        .post('/api/resource')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(facilityData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('facility');
    });

    it('should create a guide resource', async () => {
      const response = await request(app)
        .post('/api/resource')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .send(guideData);

      expect(response.status).toBe(201);
      expect(response.body.data.category).toBe('guide');
    });

    it('should validate facility location data', async () => {
      const invalidData = {
        ...facilityData,
        location: { type: 'point' } // Missing coordinates
      };

      const response = await request(app)
        .post('/api/resource')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/resource/facilities', () => {
    beforeEach(async () => {
      await Resource.create({
        ...facilityData,
        added_by: adminUser._id
      });
    });

    it('should get all facilities', async () => {
      const response = await request(app)
        .get('/api/resource/facilities')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.resources).toHaveLength(1);
    });

    it('should filter facilities by type', async () => {
      const response = await request(app)
        .get('/api/resource/facilities?type=hospital')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources[0].type).toBe('hospital');
    });

    it('should filter facilities by city', async () => {
      const response = await request(app)
        .get('/api/resource/facilities?city=Colombo')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources[0].location.address.city).toBe('Colombo');
    });
  });

  describe('GET /api/resource/guides', () => {
    beforeEach(async () => {
      await Resource.create({
        ...guideData,
        added_by: verifiedUser._id
      });
    });

    it('should get all guides', async () => {
      const response = await request(app)
        .get('/api/resource/guides')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources[0].category).toBe('guide');
    });
  });

  describe('GET /api/resource/emergency-contacts', () => {
    beforeEach(async () => {
      await Resource.create({
        ...emergencyContactData,
        added_by: adminUser._id
      });
    });

    it('should get all emergency contacts', async () => {
      const response = await request(app)
        .get('/api/resource/emergency-contacts')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources[0].category).toBe('emergency_contact');
    });
  });

  describe('GET /api/resource/facilities/nearby', () => {
    beforeEach(async () => {
      await Resource.create({
        ...facilityData,
        added_by: adminUser._id
      });
    });

    it('should get nearby facilities', async () => {
      const response = await request(app)
        .get('/api/resource/facilities/nearby')
        .query({
          latitude: 6.0535,
          longitude: 80.2389,
          maxDistance: 1000
        })
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require coordinates', async () => {
      const response = await request(app)
        .get('/api/resource/facilities/nearby')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/resource/:id', () => {
    let testResource;

    beforeEach(async () => {
      testResource = await Resource.create({
        ...facilityData,
        added_by: adminUser._id
      });
    });

    it('should allow admin to update resource', async () => {
      const response = await request(app)
        .put(`/api/resource/${testResource._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ availability_status: 'closed' });

      expect(response.status).toBe(200);
      expect(response.body.data.availability_status).toBe('closed');
    });

    it('should allow resource creator to update', async () => {
      const userResource = await Resource.create({
        ...guideData,
        added_by: verifiedUser._id
      });

      const response = await request(app)
        .put(`/api/resource/${userResource._id}`)
        .set('Authorization', `Bearer ${verifiedToken}`)
        .send({ description: 'Updated description' });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should not allow unauthorized updates', async () => {
      const response = await request(app)
        .put(`/api/resource/${testResource._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ availability_status: 'closed' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/resource/:id', () => {
    let testResource;

    beforeEach(async () => {
      testResource = await Resource.create({
        ...facilityData,
        added_by: adminUser._id
      });
    });

    it('should allow admin to delete resource', async () => {
      const response = await request(app)
        .delete(`/api/resource/${testResource._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const deletedResource = await Resource.findById(testResource._id);
      expect(deletedResource).toBeNull();
    });

    it('should allow resource creator to delete', async () => {
      const userResource = await Resource.create({
        ...guideData,
        added_by: verifiedUser._id
      });

      const response = await request(app)
        .delete(`/api/resource/${userResource._id}`)
        .set('Authorization', `Bearer ${verifiedToken}`);

      expect(response.status).toBe(200);
    });

    it('should not allow unauthorized deletion', async () => {
      const response = await request(app)
        .delete(`/api/resource/${testResource._id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });
});