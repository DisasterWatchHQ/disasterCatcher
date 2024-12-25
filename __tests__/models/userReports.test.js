import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserReports from '../../models/userReports.js';

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

describe('UserReports Model', () => {
  const validReportData = {
    title: 'Test Report',
    disaster_category: 'flood',
    description: 'Test description',
    location: {
      address: {
        city: 'Test City',
        district: 'Test District',
        province: 'Test Province'
      }
    },
    user_id: new mongoose.Types.ObjectId()
  };

  it('should create report with valid data', async () => {
    const report = await UserReports.create(validReportData);
    expect(report.title).toBe(validReportData.title);
    expect(report.status).toBe('pending');
  });

  it('should fail without required fields', async () => {
    const invalidReport = new UserReports({
      title: 'Test Report'
    });

    await expect(invalidReport.save()).rejects.toThrow();
  });

  it('should fail with invalid disaster category', async () => {
    const invalidReport = new UserReports({
      ...validReportData,
      disaster_category: 'invalid'
    });

    await expect(invalidReport.save()).rejects.toThrow();
  });

  it('should fail with invalid image URLs', async () => {
    const invalidReport = new UserReports({
      ...validReportData,
      images: ['invalid-url']
    });

    await expect(invalidReport.save()).rejects.toThrow();
  });

  it('should accept valid image URLs', async () => {
    const validReport = new UserReports({
      ...validReportData,
      images: ['http://example.com/image.jpg']
    });

    const savedReport = await validReport.save();
    expect(savedReport.images[0]).toBe('http://example.com/image.jpg');
  });
});