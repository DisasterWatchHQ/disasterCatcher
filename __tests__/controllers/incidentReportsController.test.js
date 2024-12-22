import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import IncidentReports from '../../models/incidentReport.js';
import User from '../../models/users.js';
import jwt from 'jsonwebtoken';

let mongoServer;
let adminToken;
let verifiedUserToken;
let regularUserToken;
let adminUser;
let verifiedUser;
let regularUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create users with different roles
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
    type: 'registered',
    verification_status: false
  });

  // Create tokens
  adminToken = jwt.sign(
    { userId: adminUser._id, type: 'admin' },
    process.env.JWT_SECRET || 'test-secret'
  );

  verifiedUserToken = jwt.sign(
    { userId: verifiedUser._id, type: 'verified' },
    process.env.JWT_SECRET || 'test-secret'
  );

  regularUserToken = jwt.sign(
    { userId: regularUser._id, type: 'registered' },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await IncidentReports.deleteMany({});
});

describe('Incident Reports Controller', () => {
  const validIncidentData = {
    title: 'Test Incident',
    disaster_category: 'flood',
    description: 'Test description',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: {
        city: 'Test City',
        district: 'Test District',
        province: 'Test Province',
        details: 'Test Address Details'
      }
    },
    date_time: new Date().toISOString(),
    severity: 'high',
    response_status: 'pending',
    images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
  };

  describe('POST /api/incidentReport', () => {
    it('should allow verified user to create incident report', async () => {
      const response = await request(app)
        .post('/api/incidentReport')
        .set('Authorization', `Bearer ${verifiedUserToken}`)
        .send(validIncidentData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(validIncidentData.title);
      expect(response.body.user_id.id).toBe(verifiedUser._id.toString());
    });

    it('should allow admin to create incident report', async () => {
      const response = await request(app)
        .post('/api/incidentReport')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validIncidentData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(validIncidentData.title);
    });

    it('should not allow regular user to create incident report', async () => {
      const response = await request(app)
        .post('/api/incidentReport')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(validIncidentData);

      expect(response.status).toBe(403);
    });

    it('should validate incident data', async () => {
      const invalidData = {
        ...validIncidentData,
        disaster_category: 'invalid_category'
      };

      const response = await request(app)
        .post('/api/incidentReport')
        .set('Authorization', `Bearer ${verifiedUserToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/incidentReport', () => {
    beforeEach(async () => {
      await IncidentReports.create([
        {
          ...validIncidentData,
          user_id: verifiedUser._id
        },
        {
          ...validIncidentData,
          disaster_category: 'earthquake',
          severity: 'medium',
          user_id: verifiedUser._id
        }
      ]);
    });

    it('should allow any user to get all incident reports', async () => {
      const response = await request(app)
        .get('/api/incidentReport')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reports).toHaveLength(2);
    });

    it('should filter reports by disaster category', async () => {
      const response = await request(app)
        .get('/api/incidentReport?disaster_category=flood')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reports).toHaveLength(1);
      expect(response.body.reports[0].disaster_category).toBe('flood');
    });

    it('should filter reports by location', async () => {
      const response = await request(app)
        .get('/api/incidentReport?city=Test City')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reports.length).toBeGreaterThan(0);
      expect(response.body.reports[0].location.address.city).toBe('Test City');
    });
  });

  describe('GET /api/incidentReport/nearby', () => {
    beforeEach(async () => {
      await IncidentReports.create({
        ...validIncidentData,
        user_id: verifiedUser._id  // Add the required user_id
      });
    });

    it('should get nearby incidents', async () => {
        const response = await request(app)
          .get('/api/incidentReport/nearby')
          .query({
            latitude: validIncidentData.location.latitude,
            longitude: validIncidentData.location.longitude,
            maxDistance: 1000
          })
          .set('Authorization', `Bearer ${regularUserToken}`);
    
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
  });

  describe('PUT /api/incidentReport/:id', () => {
    let testIncident;
  
    beforeEach(async () => {
      testIncident = await IncidentReports.create({
        ...validIncidentData,
        user_id: verifiedUser._id
      });
    });
  
    it('should allow verified user to update their own report', async () => {
      const updateData = {
        ...validIncidentData, // Include all required fields
        severity: 'medium',
        description: 'Updated description'
      };
  
      const response = await request(app)
        .put(`/api/incidentReport/${testIncident._id}`)
        .set('Authorization', `Bearer ${verifiedUserToken}`)
        .send(updateData);
  
      expect(response.status).toBe(200);
      expect(response.body.severity).toBe('medium');
    });
  });
  
  describe('DELETE /api/incidentReport/:id', () => {
    let testIncident;
  
    beforeEach(async () => {
      testIncident = await IncidentReports.create({
        ...validIncidentData,
        user_id: verifiedUser._id
      });
    });
  
    it('should allow verified user to delete their own report', async () => {
      const response = await request(app)
        .delete(`/api/incidentReport/${testIncident._id}`)
        .set('Authorization', `Bearer ${verifiedUserToken}`);
  
      expect(response.status).toBe(200);
      const deletedReport = await IncidentReports.findById(testIncident._id);
      expect(deletedReport).toBeNull();
    });
  });
});