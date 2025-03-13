import { pushNotificationService } from "../services/pushNotificationService.js";
import User from "../models/users.js";
import WebPushSubscription from "../models/WebPushSubscription.js";
import { sendNotification } from "../services/notificationService.js";

export const notificationController = {
  broadcast: async (message, location = null, radius = 50) => {
    if (location) {
      return await pushNotificationService.broadcastToLocation(
        location,
        message,
        radius,
      );
    }
    return [];
  },

  sendToUser: async (userId, message) => {
    return await pushNotificationService.sendPushNotification(userId, message);
  },

  subscribeWebPush: async (req, res) => {
    try {
      const { subscription } = req.body;
      const userId = req.user._id;

      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: "Subscription object is required",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { webPushSubscription: subscription } },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await pushNotificationService.sendPushNotification(userId, {
        title: "Welcome to DisasterWatch Web",
        body: "You will now receive important updates about disasters in your area.",
        data: { type: "WELCOME" },
      });

      res.status(200).json({
        success: true,
        message: "Web push subscription successful",
      });
    } catch (error) {
      console.error("Error in subscribeWebPush:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error subscribing to web push notifications",
      });
    }
  },

  unsubscribeWebPush: async (req, res) => {
    try {
      const userId = req.user._id;

      const user = await User.findByIdAndUpdate(
        userId,
        { $unset: { webPushSubscription: 1 } },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Web push subscription removed",
      });
    } catch (error) {
      console.error("Error in unsubscribeWebPush:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "Error unsubscribing from web push notifications",
      });
    }
  },

  subscribe: async (req, res) => {
    try {
      const { subscription, userAgent, platform } = req.body;
      const userId = req.user._id;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ message: "Invalid subscription data" });
      }

      const existingSubscription = await WebPushSubscription.findOne({
        "subscription.endpoint": subscription.endpoint,
      });

      if (existingSubscription) {
        existingSubscription.userId = userId;
        existingSubscription.userAgent = userAgent;
        existingSubscription.platform = platform;
        existingSubscription.lastActive = new Date();
        await existingSubscription.save();
      } else {
        await WebPushSubscription.create({
          userId,
          subscription,
          userAgent,
          platform,
        });
      }

      await sendNotification(userId, {
        title: "Welcome to Disaster Watch",
        body: "You will now receive important updates about disasters in your area.",
        url: "/dashboard",
      });

      res
        .status(201)
        .json({ message: "Successfully subscribed to notifications" });
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      res.status(500).json({ message: "Error subscribing to notifications" });
    }
  },

  unsubscribe: async (req, res) => {
    try {
      const userId = req.user._id;

      await WebPushSubscription.deleteMany({ userId });

      res.json({ message: "Successfully unsubscribed from notifications" });
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
      res
        .status(500)
        .json({ message: "Error unsubscribing from notifications" });
    }
  },

  getSubscriptions: async (req, res) => {
    try {
      const userId = req.user._id;
      const subscriptions = await WebPushSubscription.find({ userId })
        .select("-subscription.keys.auth")
        .sort("-lastActive");

      res.json(subscriptions);
    } catch (error) {
      console.error("Error getting notification subscriptions:", error);
      res
        .status(500)
        .json({ message: "Error getting notification subscriptions" });
    }
  },
};
