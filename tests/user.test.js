import request from 'supertest';
import app from './setup.js';
import User from '../models/users.js';
import jwt from 'jsonwebtoken';

const TEST_PORT = 5001;

describe('User Routes', () => {
  let testUser;
  let testToken;
  let officialUser;
  let officialToken;

  beforeEach(async () => {
    // Create test public user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      workId: 'TEST123',
      associated_department: 'Fire Department',
      role: 'public'
    });

    // Create test official user
    officialUser = await User.create({
      name: 'Official User',
      email: 'official@example.com',
      password: 'password123',
      workId: 'OFFICIAL123',
      associated_department: 'Police',
      role: 'official'
    });

    testToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET);
    officialToken = jwt.sign({ userId: officialUser._id }, process.env.JWT_SECRET);
  });

  describe('Authentication', () => {
    test('POST /api/users/login - should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test('POST /api/users/login - should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Password Reset', () => {
    test('POST /api/users/forgot-password - should generate reset token', async () => {
      const response = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.resetToken).toBeDefined();
    });

    test('POST /api/users/reset-password - should reset password with valid token', async () => {
      const resetToken = testUser.createPasswordResetToken();
      await testUser.save();

      const response = await request(app)
        .post('/api/users/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
    });
  });

  describe('User Preferences', () => {
    test('PATCH /api/users/preferences - should update user preferences', async () => {
      const response = await request(app)
        .patch('/api/users/preferences')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          preferences: {
            notifications: {
              push: true,
              email: false,
              sms: true,
              radius: 100
            },
            theme: {
              mode: 'dark'
            },
            language: 'es'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.preferences.notifications.push).toBe(true);
      expect(response.body.user.preferences.theme.mode).toBe('dark');
    });
  });

  describe('Push Token Management', () => {
    test('PATCH /api/users/push-token - should update push token', async () => {
      const response = await request(app)
        .patch('/api/users/push-token')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.pushToken).toBe('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
    });
  });

  describe('Admin Routes', () => {
    test('GET /api/users - should list all users (admin only)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${officialToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('GET /api/users - should not allow public users to list all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(403);
    });

    test('POST /api/users - should create new user (admin only)', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${officialToken}`)
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
          workId: 'NEW123',
          associated_department: 'Fire Department',
          role: 'official'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('DELETE /api/users/:id - should delete user (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${officialToken}`);

      expect(response.status).toBe(200);

      // Verify user is deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });
  });
}); 