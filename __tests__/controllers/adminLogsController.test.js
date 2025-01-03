import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import AdminLog from '../../models/adminLogs.js';
import { createSystemLog } from '../../controllers/adminLogsController.js';

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
  await AdminLog.deleteMany({});
});

describe('AdminLogs Controller', () => {
  it('should create a system log with valid data', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();

    const log = await createSystemLog(
      adminId,
      'CREATE', // Using a valid action from enum
      'user_report',
      targetId,
      {
        message: 'Test log message',
        details: { key: 'value' }
      }
    );

    expect(log).toBeTruthy();
    expect(log.admin_id.toString()).toBe(adminId.toString());
    expect(log.target_type).toBe('user_report');
    expect(log.target_id.toString()).toBe(targetId.toString());
    expect(log.details.get('message')).toBe('Test log message');
  });

  it('should handle invalid target type', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();

    const log = await createSystemLog(
      adminId,
      'CREATE',
      'invalid_type', // This should fail gracefully
      targetId,
      { message: 'Test log message' }
    );

    expect(log).toBeNull();
  });

  it('should create log with different actions', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();

    const actions = ['CREATE', 'UPDATE', 'DELETE'];

    for (const action of actions) {
      const log = await createSystemLog(
        adminId,
        action,
        'user_report',
        targetId,
        { message: `${action} operation` }
      );

      expect(log).toBeTruthy();
      expect(log.action).toBe(action);
    }
  });

  it('should store details in Map format', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();
    const details = {
      message: 'Test message',
      oldValue: 'old',
      newValue: 'new'
    };

    const log = await createSystemLog(
      adminId,
      'UPDATE',
      'user_report',
      targetId,
      details
    );

    expect(log).toBeTruthy();
    expect(log.details instanceof Map).toBe(true);
    expect(log.details.get('message')).toBe('Test message');
    expect(log.details.get('oldValue')).toBe('old');
    expect(log.details.get('newValue')).toBe('new');
  });

  it('should require all mandatory fields', async () => {
    const log = await createSystemLog(
      null, // Missing admin_id
      'CREATE',
      'user_report',
      new mongoose.Types.ObjectId(),
      { message: 'Test' }
    );

    expect(log).toBeNull();
  });
});