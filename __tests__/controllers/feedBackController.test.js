import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js';
import Feedback from '../../models/feedback.js';
import User from '../../models/users.js';
import jwt from 'jsonwebtoken';

let mongoServer;
let adminToken;
let userToken;
let adminUser;
let regularUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create admin user
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    type: 'admin',
    verification_status: true  // Add this if needed
  });

  // Create regular user
  regularUser = await User.create({
    name: 'Regular User',
    email: 'user@test.com',
    password: 'user123',
    type: 'registered'
  });

  adminToken = jwt.sign(
    { userId: adminUser._id, type: 'admin' },
    process.env.JWT_SECRET || 'test-secret'
  );

  userToken = jwt.sign(
    { userId: regularUser._id, type: 'registered' },
    process.env.JWT_SECRET || 'test-secret'
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Feedback.deleteMany({});
});

describe('Feedback Controller', () => {
  const validFeedbackData = {
    feedback_type: 'bug',
    message: 'Test feedback message'
  };

  describe('POST /api/feedback', () => {
    it('should allow regular user to create feedback', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validFeedbackData);

      expect(response.status).toBe(201);
      expect(response.body.feedback_type).toBe(validFeedbackData.feedback_type);
      expect(response.body.user_id.id).toBe(regularUser._id.toString());
    });

    it('should not allow admin to create feedback', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFeedbackData);

      expect(response.status).toBe(403);
    });

    it('should validate feedback data', async () => {
      const invalidData = {
        feedback_type: 'invalid_type',
        message: ''
      };

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/feedback', () => {
    beforeEach(async () => {
      // Create test feedback entries
      await Feedback.create([
        {
          user_id: regularUser._id,
          feedback_type: 'bug',
          message: 'Test bug',
          status: 'pending'
        },
        {
          user_id: regularUser._id,
          feedback_type: 'feature_request',
          message: 'Test feature',
          status: 'in_progress'
        }
      ]);
    });

    it('should allow admin to get all feedback', async () => {
      const response = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
          const feedbacks = response.body.feedbacks || response.body;
          expect(Array.isArray(feedbacks)).toBe(true);
          expect(feedbacks.length).toBe(2);
    });

    it('should not allow regular user to get all feedback', async () => {
      const response = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow filtering feedback by type', async () => {
        const response = await request(app)
          .get('/api/feedback?feedback_type=bug')
          .set('Authorization', `Bearer ${adminToken}`);
    
        expect(response.status).toBe(200);
        const feedbacks = response.body.feedbacks || response.body;
        expect(Array.isArray(feedbacks)).toBe(true);
        expect(feedbacks.length).toBe(1);
        expect(feedbacks[0].feedback_type).toBe('bug');
    });
  });

  describe('GET /api/feedback/my-feedback', () => {
    beforeEach(async () => {
      await Feedback.create([
        {
          user_id: regularUser._id,
          feedback_type: 'bug',
          message: 'Test bug',
          status: 'pending'
        }
      ]);
    });

    it('should allow user to get their own feedback', async () => {
      const response = await request(app)
        .get('/api/feedback/my-feedback')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('PUT /api/feedback/:id', () => {
    let testFeedback;
  
    beforeEach(async () => {
      testFeedback = await Feedback.create({
        user_id: regularUser._id,
        feedback_type: 'bug',
        message: 'Test bug',
        status: 'pending'
      });
    });
  
    it('should allow admin to update feedback status', async () => {
      const updateData = {
        status: 'resolved',
        admin_response: 'Issue fixed'
      };
  
      const response = await request(app)
        .put(`/api/feedback/${testFeedback._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
  
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
      expect(response.body.admin_response.message).toBe('Issue fixed');
    });
  });
  
  describe('DELETE /api/feedback/:id', () => {
    let testFeedback;
  
    beforeEach(async () => {
      testFeedback = await Feedback.create({
        user_id: regularUser._id,
        feedback_type: 'bug',
        message: 'Test bug',
        status: 'pending'
      });
    });
  
    it('should allow admin to delete feedback', async () => {
      const response = await request(app)
        .delete(`/api/feedback/${testFeedback._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
  
      expect(response.status).toBe(200);
      
      const deletedFeedback = await Feedback.findById(testFeedback._id);
      expect(deletedFeedback).toBeNull();
    });
  });
});