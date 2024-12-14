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
      'UPDATE',
      'user_report',
      targetId,
      {
        message: 'Test log'
      }
    );

    expect(log).toBeTruthy();
    expect(log.admin_id).toEqual(adminId);
    expect(log.target_type).toBe('user_report');
    expect(log.target_id).toEqual(targetId);
  });

  it('should handle invalid target type', async () => {
    const log = await createSystemLog(
      new mongoose.Types.ObjectId(),
      'UPDATE',
      'invalid_type',
      new mongoose.Types.ObjectId(),
      { message: 'Test log' }
    );

    expect(log).toBeNull();
  });
});