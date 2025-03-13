import webpush from "web-push";
import WebPushSubscription from "../models/WebPushSubscription.js";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Send a push notification to a specific user
 * @param {string} userId - The ID of the user to send the notification to
 * @param {Object} notification - The notification payload
 * @param {string} notification.title - The notification title
 * @param {string} notification.body - The notification body
 * @param {string} [notification.icon] - The notification icon URL
 * @param {string} [notification.url] - The URL to open when clicked
 * @param {Object} [notification.data] - Additional data to send with the notification
 * @returns {Promise<void>}
 */

export const sendNotification = async (userId, notification) => {
  try {
    const subscriptions = await WebPushSubscription.find({ userId });

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/icons/notification-icon.png",
      badge: "/icons/notification-badge.png",
      url: notification.url,
      data: notification.data,
      timestamp: new Date().toISOString(),
    });

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription.subscription, payload);
        subscription.lastActive = new Date();
        await subscription.save();
      } catch (error) {
        if (error.statusCode === 410) {
          await WebPushSubscription.findByIdAndDelete(subscription._id);
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Error in sendNotification:", error);
    throw error;
  }
};

/**
 * Send a push notification to all subscribed users
 * @param {Object} notification - The notification payload
 * @returns {Promise<void>}
 */
export const broadcastNotification = async (notification) => {
  try {
    const subscriptions = await WebPushSubscription.find();

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/icons/notification-icon.png",
      badge: "/icons/notification-badge.png",
      url: notification.url,
      data: notification.data,
      timestamp: new Date().toISOString(),
    });

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription.subscription, payload);

        subscription.lastActive = new Date();
        await subscription.save();
      } catch (error) {
        if (error.statusCode === 410) {
          await WebPushSubscription.findByIdAndDelete(subscription._id);
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Error in broadcastNotification:", error);
    throw error;
  }
};
