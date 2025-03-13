import request from "supertest";
import app from "./setup.js";
import User from "../models/users.js";
import Resource from "../models/resources.js";
import jwt from "jsonwebtoken";

describe("Resource System", () => {
  let testUser;
  let testToken;
  let testResource;

  beforeEach(async () => {
    // Clean up existing test data
    await User.deleteMany({ email: "test@example.com" });
    await Resource.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      workId: "TEST123",
      associated_department: "Fire Department",
      role: "public",
      location: {
        latitude: 1.234,
        longitude: 5.678,
      },
      isVerified: true,
    });

    testToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET);

    // Create test resource (facility)
    testResource = await Resource.create({
      name: "Test Hospital",
      category: "facility",
      type: "hospital",
      contact: {
        phone: "1234567890",
        email: "test@hospital.com",
      },
      location: {
        type: "point",
        coordinates: [5.678, 1.234],
        address: {
          formatted_address: "Test Address",
          city: "Test City",
          district: "Test District",
          province: "Test Province",
          details: "Test Details",
        },
      },
      availability_status: "open",
      operating_hours: {
        monday: { open: "09:00", close: "17:00", is24Hours: false },
        tuesday: { open: "09:00", close: "17:00", is24Hours: false },
      },
      added_by: testUser._id,
      status: "active",
      tags: ["emergency", "medical"],
    });
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: "test@example.com" });
    await Resource.deleteMany({});
  });

  describe("Resource Creation", () => {
    test("should create a new facility resource", async () => {
      const response = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "New Hospital",
          category: "facility",
          type: "hospital",
          contact: {
            phone: "1234567890",
            email: "new@hospital.com",
          },
          location: {
            type: "point",
            coordinates: [5.678, 1.234],
            address: {
              formatted_address: "New Address",
              city: "New City",
              district: "New District",
              province: "New Province",
              details: "New Details",
            },
          },
          availability_status: "open",
          operating_hours: {
            monday: { open: "09:00", close: "17:00", is24Hours: false },
          },
          metadata: {
            capacity: 100,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("New Hospital");
      expect(response.body.data.category).toBe("facility");
    });

    test("should create a new guide resource", async () => {
      const response = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "Emergency Guide",
          category: "guide",
          type: "disaster_guide",
          description: "Emergency response guide",
          content: "Guide content here",
          contact: {
            phone: "1234567890",
            email: "guide@example.com",
          },
          metadata: {
            lastUpdated: new Date().toISOString(),
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Emergency Guide");
      expect(response.body.data.category).toBe("guide");
    });

    test("should create a new emergency contact resource", async () => {
      const response = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "Emergency Hotline",
          category: "emergency_contact",
          type: "emergency_number",
          contact: {
            phone: "911",
            email: "emergency@example.com",
          },
          emergency_level: "high",
          metadata: {
            serviceHours: "24/7",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Emergency Hotline");
      expect(response.body.data.category).toBe("emergency_contact");
    });

    test("should validate required fields for facility", async () => {
      const response = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "Incomplete Facility",
          category: "facility",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Resource Queries", () => {
    test("should get facilities with filters", async () => {
      const response = await request(app)
        .get("/api/resources/facilities")
        .query({
          type: "hospital",
          availability_status: "open",
          city: "Test City",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.resources.length).toBeGreaterThan(0);
    });

    test("should get guides with filters", async () => {
      const response = await request(app).get("/api/resources/guides").query({
        type: "disaster_guide",
        tags: "emergency",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.resources)).toBe(true);
    });

    test("should get emergency contacts with filters", async () => {
      const response = await request(app)
        .get("/api/resources/emergency-contacts")
        .query({
          emergency_level: "high",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.resources)).toBe(true);
    });

    test("should get nearby facilities", async () => {
      const response = await request(app)
        .get("/api/resources/facilities/nearby")
        .query({
          latitude: 1.234,
          longitude: 5.678,
          maxDistance: 10000,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("should get resource by ID", async () => {
      const response = await request(app).get(
        `/api/resources/${testResource._id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testResource._id.toString());
    });
  });

  describe("Resource Updates", () => {
    test("should update resource", async () => {
      const response = await request(app)
        .put(`/api/resources/${testResource._id}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "Updated Hospital",
          availability_status: "under_maintenance",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Hospital");
      expect(response.body.data.availability_status).toBe("under_maintenance");
    });

    test("should delete resource", async () => {
      const response = await request(app)
        .delete(`/api/resources/${testResource._id}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify resource is deleted
      const deletedResource = await Resource.findById(testResource._id);
      expect(deletedResource).toBeNull();
    });
  });

  describe("Resource Validation", () => {
    test("should validate facility location", async () => {
      const response = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "Invalid Facility",
          category: "facility",
          type: "hospital",
          contact: {
            phone: "1234567890",
            email: "test@hospital.com",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should validate guide content", async () => {
      const response = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "Invalid Guide",
          category: "guide",
          type: "disaster_guide",
          description: "Test description",
          contact: {
            phone: "1234567890",
            email: "test@example.com",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should validate emergency contact level", async () => {
      const response = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          name: "Invalid Contact",
          category: "emergency_contact",
          type: "emergency_number",
          contact: {
            phone: "1234567890",
            email: "test@example.com",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
