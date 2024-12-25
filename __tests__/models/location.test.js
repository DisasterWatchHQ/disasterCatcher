import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Location from '../../models/location.js';

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
  await Location.deleteMany({});
});

describe('Location Model', () => {
  const validLocationData = {
    current_location: 'Test Location',
    address: '123 Test Street, Test City',
    latitude: 6.927079,
    longitude: 79.861244,
    geohash: 'testgeohash123'
  };

  it('should create location with valid data', async () => {
    const location = await Location.create(validLocationData);
    expect(location.current_location).toBe(validLocationData.current_location);
    expect(location.latitude).toBe(validLocationData.latitude);
  });

  it('should require current_location', async () => {
    const invalidData = { ...validLocationData };
    delete invalidData.current_location;
    await expect(Location.create(invalidData)).rejects.toThrow();
  });

  it('should validate location name length', async () => {
    const invalidData = {
      ...validLocationData,
      current_location: 'A'
    };
    await expect(Location.create(invalidData)).rejects.toThrow();
  });

  it('should validate coordinate ranges', async () => {
    const invalidData = {
      ...validLocationData,
      latitude: 91
    };
    await expect(Location.create(invalidData)).rejects.toThrow();
  });

  it('should enforce unique current_location', async () => {
    // Create first location
    await Location.create(validLocationData);
    
    // Try to create another location with the same name
    try {
      await Location.create(validLocationData);
      fail('Should have thrown duplicate key error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error code
    }
  });

  it('should enforce case-insensitive uniqueness for current_location', async () => {
    // Create first location
    await Location.create(validLocationData);
    
    // Try to create another location with the same name but different case
    const duplicateData = {
      ...validLocationData,
      current_location: validLocationData.current_location.toUpperCase()
    };

    try {
      await Location.create(duplicateData);
      fail('Should have thrown duplicate key error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    }
  });

  it('should validate address minimum length', async () => {
    const invalidData = {
      ...validLocationData,
      address: '123' // Too short
    };
    await expect(Location.create(invalidData)).rejects.toThrow();
  });

  it('should allow different locations with different names', async () => {
    // Create first location
    await Location.create(validLocationData);
    
    // Create second location with different name
    const secondLocation = {
      ...validLocationData,
      current_location: 'Different Location'
    };

    const location = await Location.create(secondLocation);
    expect(location.current_location).toBe(secondLocation.current_location);
  });
});