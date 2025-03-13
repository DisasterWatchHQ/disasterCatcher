import request from "supertest";
import app from "./setup.js";
import User from "../models/users.js";
import { notificationController } from "../controllers/notificationController.js";
import jwt from "jsonwebtoken";

describe("Notification System", () => {
  let testUser;
  let testToken;

  beforeEach(async () => {
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
      pushToken: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    });

    testToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET);
  });

  describe("Push Notifications", () => {
    test("should update push token", async () => {
      const response = await request(app)
        .patch("/api/users/push-token")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          pushToken: "ExponentPushToken[newtoken]",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.pushToken).toBe("ExponentPushToken[newtoken]");
    });

    test("should send push notification to user", async () => {
      const message = {
        title: "Test Notification",
        body: "This is a test notification",
        data: { type: "TEST" },
      };

      const result = await notificationController.sendToUser(testUser._id, message);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test("should broadcast to location", async () => {
      const message = {
        title: "Location Alert",
        body: "Test location alert",
        data: { type: "LOCATION_ALERT" },
      };

      const location = {
        latitude: 1.234,
        longitude: 5.678,
      };

      const result = await notificationController.broadcast(message, location, 50);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Notification Preferences", () => {
    test("should respect notification preferences", async () => {
      // Disable push notifications
      await request(app)
        .patch("/api/users/preferences")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          preferences: {
            notifications: {
              push: false,
              email: true,
              sms: false,
              radius: 50,
            },
          },
        });

      const message = {
        title: "Test Notification",
        body: "This is a test notification",
        data: { type: "TEST" },
      };

      const result = await notificationController.sendToUser(testUser._id, message);
      expect(result).toBe(false); // Should not send due to disabled preferences
    });
  });
});
