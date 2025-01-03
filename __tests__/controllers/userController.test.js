import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../index.js'; // You'll need to export app from index.js
import User from '../../models/users.js';
import jwt from 'jsonwebtoken';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Controller', () => {
  describe('POST /api/user/register', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        type: 'registered'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email.toLowerCase());
    });

    it('should not create user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      await User.create(userData);

      const response = await request(app)
        .post('/api/user/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/login', () => {
    it('should authenticate user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        type: 'registered'
      };

      await User.create(userData);

      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should not authenticate with wrong password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      await User.create(userData);

      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user', () => {
    it('should get all users with pagination', async () => {
      // Create test admin user
      const adminUser = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        type: 'admin'
      });

      const token = jwt.sign(
        { userId: adminUser._id, type: 'admin' },
        process.env.JWT_SECRET
      );

      // Create multiple test users
      await User.create([
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'password123'
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'password123'
        }
      ]);

      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('PUT /api/user/:id', () => {
    it('should update user successfully', async () => {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        type: 'admin'
      });

      const token = jwt.sign(
        { userId: adminUser._id, type: 'admin' },
        process.env.JWT_SECRET
      );

      // Create user to update
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .put(`/api/user/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/user/:id', () => {
    it('should delete user successfully', async () => {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        type: 'admin'
      });

      const token = jwt.sign(
        { userId: adminUser._id, type: 'admin' },
        process.env.JWT_SECRET
      );

      // Create user to delete
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .delete(`/api/user/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully.');
    });
  });
});