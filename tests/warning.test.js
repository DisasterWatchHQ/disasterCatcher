import request from 'supertest';
import app from './setup.js';
import User from '../models/users.js';
import Warning from '../models/warning.js';
import jwt from 'jsonwebtoken';

describe('Warning System', () => {
  let testUser;
  let testToken;
  let testWarning;

  beforeEach(async () => {
    // Clean up existing test data
    await User.deleteMany({ email: 'test@example.com' });
    await Warning.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      workId: 'TEST123',
      associated_department: 'Fire Department',
      role: 'public',
      location: {
        latitude: 1.234,
        longitude: 5.678
      }
    });

    testToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET);

    // Create test warning
    testWarning = await Warning.create({
      title: 'Test Warning',
      disaster_category: 'fire',
      description: 'Test warning description',
      affected_locations: [{
        coordinates: {
          latitude: 1.234,
          longitude: 5.678
        },
        address: {
          city: 'Test City',
          district: 'Test District',
          province: 'Test Province'
        }
      }],
      severity: 'high',
      created_by: testUser._id,
      status: 'active'
    });
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'test@example.com' });
    await Warning.deleteMany({});
  });

  describe('Warning Creation', () => {
    test('should create a new warning', async () => {
      const response = await request(app)
        .post('/api/warnings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'New Warning',
          disaster_category: 'flood',
          description: 'New warning description',
          affected_locations: [{
            coordinates: {
              latitude: 1.234,
              longitude: 5.678
            },
            address: {
              city: 'Test City',
              district: 'Test District',
              province: 'Test Province'
            }
          }],
          severity: 'medium',
          created_by: testUser._id
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Warning');
      expect(response.body.disaster_category).toBe('flood');
      expect(response.body.status).toBe('active');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/warnings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Incomplete Warning'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    test('should validate disaster category', async () => {
      const response = await request(app)
        .post('/api/warnings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Invalid Category Warning',
          disaster_category: 'invalid_category',
          description: 'Test description',
          affected_locations: [{
            coordinates: {
              latitude: 1.234,
              longitude: 5.678
            },
            address: {
              city: 'Test City',
              district: 'Test District',
              province: 'Test Province'
            }
          }],
          severity: 'high',
          created_by: testUser._id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid disaster category');
    });
  });

  describe('Warning Updates', () => {
    test('should add update to warning', async () => {
      const response = await request(app)
        .post(`/api/warnings/${testWarning._id}/updates`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          update_text: 'Test update',
          severity_change: 'critical'
        });

      expect(response.status).toBe(200);
      expect(response.body.updates).toHaveLength(1);
      expect(response.body.updates[0].update_text).toBe('Test update');
      expect(response.body.severity).toBe('critical');
    });

    test('should not update resolved warning', async () => {
      // First resolve the warning
      await Warning.findByIdAndUpdate(testWarning._id, { status: 'resolved' });

      const response = await request(app)
        .post(`/api/warnings/${testWarning._id}/updates`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          update_text: 'Test update'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot update a resolved warning');
    });
  });

  describe('Warning Resolution', () => {
    test('should resolve warning', async () => {
      const response = await request(app)
        .post(`/api/warnings/${testWarning._id}/resolve`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          resolution_notes: 'Test resolution'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
      expect(response.body.resolution_notes).toBe('Test resolution');
    });

    test('should require resolution notes', async () => {
      const response = await request(app)
        .post(`/api/warnings/${testWarning._id}/resolve`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Resolution notes are required');
    });
  });

  describe('Warning Queries', () => {
    test('should get active warnings', async () => {
      const response = await request(app)
        .get('/api/warnings/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should get warnings with filters', async () => {
      const response = await request(app)
        .get('/api/warnings')
        .query({
          disaster_category: 'fire',
          severity: 'high',
          status: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.warnings).toBeDefined();
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBeDefined();
      expect(response.body.totalWarnings).toBeDefined();
    });

    test('should get warning by ID', async () => {
      const response = await request(app)
        .get(`/api/warnings/${testWarning._id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testWarning._id.toString());
      expect(response.body.title).toBe(testWarning.title);
    });

    test('should get warnings by location', async () => {
      const response = await request(app)
        .get('/api/warnings')
        .query({
          latitude: 1.234,
          longitude: 5.678,
          radius: 50
        });

      expect(response.status).toBe(200);
      expect(response.body.warnings).toBeDefined();
      expect(Array.isArray(response.body.warnings)).toBe(true);
      expect(response.body.warnings.length).toBeGreaterThan(0);
      expect(response.body.warnings[0].affected_locations[0].coordinates).toEqual({
        latitude: 1.234,
        longitude: 5.678
      });
    });

    test('should require latitude and longitude for location query', async () => {
      const response = await request(app)
        .get('/api/warnings/location')
        .query({
          latitude: 1.234
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Latitude and longitude are required');
    });
  });

  describe('Warning Image Validation', () => {
    test('should validate image URLs', async () => {
      const response = await request(app)
        .post('/api/warnings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Warning with Images',
          disaster_category: 'fire',
          description: 'Test description',
          affected_locations: [{
            coordinates: {
              latitude: 1.234,
              longitude: 5.678
            },
            address: {
              city: 'Test City',
              district: 'Test District',
              province: 'Test Province'
            }
          }],
          severity: 'high',
          images: ['invalid-url', 'http://valid-url.com/image.jpg']
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All images must be valid URLs starting with \'http\'');
    });

    test('should accept valid image URLs', async () => {
      const response = await request(app)
        .post('/api/warnings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Warning with Images',
          disaster_category: 'fire',
          description: 'Test description',
          affected_locations: [{
            coordinates: {
              latitude: 1.234,
              longitude: 5.678
            },
            address: {
              city: 'Test City',
              district: 'Test District',
              province: 'Test Province'
            }
          }],
          severity: 'high',
          images: ['http://valid-url.com/image1.jpg', 'http://valid-url.com/image2.jpg']
        });

      expect(response.status).toBe(201);
      expect(response.body.images).toHaveLength(2);
      expect(response.body.images[0]).toBe('http://valid-url.com/image1.jpg');
      expect(response.body.images[1]).toBe('http://valid-url.com/image2.jpg');
    });
  });

  describe('Warning Status Transitions', () => {
    test('should transition from active to monitoring', async () => {
      const response = await request(app)
        .patch(`/api/warnings/${testWarning._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'monitoring'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('monitoring');
    });

    test('should not allow invalid status transitions', async () => {
      const response = await request(app)
        .patch(`/api/warnings/${testWarning._id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status');
    });
  });

  describe('Warning Response Action Status Updates', () => {
    test('should update action status through all valid states', async () => {
      // First add an action
      const warning = await Warning.findById(testWarning._id);
      warning.response_actions.push({
        action_type: 'evacuation',
        description: 'Test action',
        performed_by: testUser._id,
        status: 'planned'
      });
      await warning.save();

      const actionId = warning.response_actions[0]._id;

      // Test status transitions
      const statuses = ['in_progress', 'completed'];
      for (const status of statuses) {
        const response = await request(app)
          .patch(`/api/warnings/${testWarning._id}/actions/${actionId}`)
          .set('Authorization', `Bearer ${testToken}`)
          .send({ status });

        expect(response.status).toBe(200);
        expect(response.body.response_actions[0].status).toBe(status);
      }
    });

    test('should not allow invalid action status updates', async () => {
      // First add an action
      const warning = await Warning.findById(testWarning._id);
      warning.response_actions.push({
        action_type: 'evacuation',
        description: 'Test action',
        performed_by: testUser._id,
        status: 'planned'
      });
      await warning.save();

      const actionId = warning.response_actions[0]._id;

      const response = await request(app)
        .patch(`/api/warnings/${testWarning._id}/actions/${actionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not a valid enum value');
    });
  });

  describe('Warning Response Actions', () => {
    test('should add response action', async () => {
      const response = await request(app)
        .post(`/api/warnings/${testWarning._id}/actions`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          action_type: 'evacuation',
          description: 'Test action'
        });

      expect(response.status).toBe(200);
      expect(response.body.response_actions).toHaveLength(1);
      expect(response.body.response_actions[0].action_type).toBe('evacuation');
      expect(response.body.response_actions[0].status).toBe('planned');
    });

    test('should update action status', async () => {
      // First add an action
      const warning = await Warning.findById(testWarning._id);
      warning.response_actions.push({
        action_type: 'evacuation',
        description: 'Test action',
        performed_by: testUser._id,
        status: 'planned'
      });
      await warning.save();

      const actionId = warning.response_actions[0]._id;

      const response = await request(app)
        .patch(`/api/warnings/${testWarning._id}/actions/${actionId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.response_actions[0].status).toBe('completed');
    });
  });
}); 