import request from "supertest";
import app from "./setup.js";
import User from "../models/users.js";
import Feedback from "../models/feedback.js";
import jwt from "jsonwebtoken";

describe("Feedback System", () => {
  let testUser;
  let testAdmin;
  let testToken;
  let adminToken;
  let testFeedback;

  beforeEach(async () => {
    // Clean up existing test data
    await User.deleteMany({
      email: { $in: ["test@example.com", "admin@example.com"] },
    });
    await Feedback.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      workId: "TEST123",
      associated_department: "Fire Department",
      role: "public",
      isVerified: true,
    });

    // Create test admin
    testAdmin = await User.create({
      name: "Test Admin",
      email: "admin@example.com",
      password: "password123",
      workId: "ADMIN123",
      associated_department: "Disaster Response Team",
      role: "official",
      isVerified: true,
    });

    testToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ userId: testAdmin._id }, process.env.JWT_SECRET);

    // Create test feedback
    testFeedback = await Feedback.create({
      user_id: testUser._id,
      feedback_type: "bug",
      message: "Test feedback message",
      status: "pending",
    });
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({
      email: { $in: ["test@example.com", "admin@example.com"] },
    });
    await Feedback.deleteMany({});
  });

  describe("Feedback Creation", () => {
    test("should create a new feedback", async () => {
      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          feedback_type: "feature_request",
          message: "New feature request",
        });

      expect(response.status).toBe(201);
      expect(response.body.feedback_type).toBe("feature_request");
      expect(response.body.message).toBe("New feature request");
      expect(response.body.status).toBe("pending");
    });

    test("should allow admin to create feedback", async () => {
      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          feedback_type: "bug",
          message: "Admin feedback",
        });

      expect(response.status).toBe(201);
      expect(response.body.feedback_type).toBe("bug");
      expect(response.body.message).toBe("Admin feedback");
      expect(response.body.status).toBe("pending");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          message: "Missing feedback type",
        });

      expect(response.status).toBe(400);
    });

    test("should validate feedback type", async () => {
      const response = await request(app)
        .post("/api/feedback")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          feedback_type: "invalid_type",
          message: "Test message",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Feedback Queries", () => {
    test("should get all feedbacks", async () => {
      const response = await request(app).get("/api/feedback");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.feedbacks)).toBe(true);
      expect(response.body.feedbacks.length).toBeGreaterThan(0);
    });

    test("should get feedbacks with filters", async () => {
      const response = await request(app).get("/api/feedback").query({
        feedback_type: "bug",
        status: "pending",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.feedbacks)).toBe(true);
      expect(response.body.feedbacks[0].feedback_type).toBe("bug");
    });

    test("should get feedback by ID", async () => {
      const response = await request(app).get(
        `/api/feedback/${testFeedback._id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testFeedback._id.toString());
    });
  });

  describe("Feedback Updates", () => {
    test("should update feedback status (admin only)", async () => {
      const response = await request(app)
        .put(`/api/feedback/${testFeedback._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "in_progress",
          admin_response: "We are working on this issue",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("in_progress");
      expect(response.body.admin_response.message).toBe(
        "We are working on this issue",
      );
    });

    test("should not allow non-admin to update feedback", async () => {
      const response = await request(app)
        .put(`/api/feedback/${testFeedback._id}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          status: "resolved",
        });

      expect(response.status).toBe(403);
    });

    test("should delete feedback (admin only)", async () => {
      const response = await request(app)
        .delete(`/api/feedback/${testFeedback._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Feedback deleted successfully");

      // Verify feedback is deleted
      const deletedFeedback = await Feedback.findById(testFeedback._id);
      expect(deletedFeedback).toBeNull();
    });

    test("should not allow non-admin to delete feedback", async () => {
      const response = await request(app)
        .delete(`/api/feedback/${testFeedback._id}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Feedback Status Transitions", () => {
    test("should transition through valid statuses", async () => {
      const statuses = ["in_progress", "resolved"];
      for (const status of statuses) {
        const response = await request(app)
          .put(`/api/feedback/${testFeedback._id}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            status,
            admin_response: `Status updated to ${status}`,
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(status);
      }
    });

    test("should not allow invalid status transitions", async () => {
      const response = await request(app)
        .put(`/api/feedback/${testFeedback._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "invalid_status",
        });

      expect(response.status).toBe(400);
    });
  });
});
