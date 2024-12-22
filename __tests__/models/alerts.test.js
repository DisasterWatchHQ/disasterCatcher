import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Alert from '../../models/alerts.js';

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

describe('Alert Model', () => {
  const validAlertData = {
    alert_type: 'warning',
    disaster: 'flood',
    distance: 10,
    time: new Date(),
    priority: 'high'
  };

  it('should create alert with valid data', async () => {
    const alert = await Alert.create(validAlertData);
    expect(alert.alert_type).toBe(validAlertData.alert_type);
    expect(alert.disaster).toBe(validAlertData.disaster);
    expect(alert.read_status).toBe(false); // default value
  });

  it('should fail with invalid alert_type', async () => {
    const invalidAlert = new Alert({
      ...validAlertData,
      alert_type: 'invalid'
    });
    await expect(invalidAlert.save()).rejects.toThrow();
  });

  it('should fail with invalid disaster type', async () => {
    const invalidAlert = new Alert({
      ...validAlertData,
      disaster: 'invalid'
    });
    await expect(invalidAlert.save()).rejects.toThrow();
  });

  it('should fail with negative distance', async () => {
    const invalidAlert = new Alert({
      ...validAlertData,
      distance: -1
    });
    await expect(invalidAlert.save()).rejects.toThrow();
  });

  it('should fail with invalid priority', async () => {
    const invalidAlert = new Alert({
      ...validAlertData,
      priority: 'invalid'
    });
    await expect(invalidAlert.save()).rejects.toThrow();
  });
});