import Notification from "../models/notifications.js";
import { sendPushNotification } from '../services/notificationService.js';

export const createSystemNotification = async (userId, message, type, priority = "medium") => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      message,
      type,
      priority,
      source: "system",
    });

    const existingNotification = await Notification.findOne({ 
      user_id: userId, 
      pushToken: { $exists: true } 
    });
    
    if (existingNotification?.pushToken) {
      await sendPushNotification(existingNotification.pushToken, notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating system notification:", error);
    return null;
  }
};

export const registerPushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id;

    await Notification.updateMany(
      { user_id: userId },
      { pushToken }
    );

    res.status(200).json({ message: 'Push token registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAlertNotification = async (userId, alertData) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      message: alertData.message,
      type: "alert",
      priority: alertData.priority || "high",
      source: "alert_system",
      metadata: new Map(Object.entries(alertData)),
    });

    const existingNotification = await Notification.findOne({ 
      user_id: userId, 
      pushToken: { $exists: true } 
    });
    
    if (existingNotification?.pushToken) {
      await sendPushNotification(existingNotification.pushToken, notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating alert notification:", error);
    return null;
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .populate("user_id", "name email");

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { status: "read" },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, status: "unread" },
      { status: "read" },
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeNotification = async (req, res) => {
  try {
    const { type, status, priority } = req.query;
    const query = { user_id: req.user.id };

    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const deletedNotifications = await Notification.deleteMany(query);

    if (deletedNotifications.deletedCount === 0) {
      return res.status(404).json({ message: "No matching notifications found to remove" });
    }

    res.status(200).json({
      message: `${deletedNotifications.deletedCount} notifications removed successfully`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
