import { Expo } from "expo-server-sdk";
import User from "../models/users.js";
import webpush from "web-push";

const expo = new Expo();

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const pushNotificationService = {
  async sendPushNotification(userId, message) {
    try {
      const user = await User.findById(userId);

      if (!user || !user.preferences.notifications.push) {
        return false;
      }

      const notifications = [];

      if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
        notifications.push({
          to: user.pushToken,
          sound: "default",
          title: message.title,
          body: message.body,
          data: message.data,
          priority: message.priority || "normal",
        });
      }

      if (user.webPushSubscription) {
        try {
          await webpush.sendNotification(
            user.webPushSubscription,
            JSON.stringify({
              title: message.title,
              body: message.body,
              data: message.data,
              icon: "/icons/notification-icon.png",
              badge: "/icons/notification-badge.png",
            })
          );
        } catch (error) {
          console.error("Error sending web push notification:", error);
          if (error.statusCode === 410) {
            await User.findByIdAndUpdate(userId, {
              $unset: { webPushSubscription: 1 },
            });
          }
        }
      }

      if (notifications.length > 0) {
        const chunks = expo.chunkPushNotifications(notifications);
        const tickets = [];

        for (const chunk of chunks) {
          try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

            tickets.push(...ticketChunk);
          } catch (error) {
            console.error("Error sending chunk:", error);
          }
        }

        return tickets;
      }

      return true;
    } catch (error) {
      console.error("Error in sendPushNotification:", error);

      return false;
    }
  },

  async broadcastToLocation(location, message, radius = 50) {
    try {
      const users = await User.find({
        "location.latitude": { $exists: true },
        "location.longitude": { $exists: true },
        "preferences.notifications.push": true,
      });

      const notifications = [];

      for (const user of users) {
        if (this.isWithinRadius(user.location, location, radius)) {
          if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
            notifications.push({
              to: user.pushToken,
              sound: "default",
              title: message.title,
              body: message.body,
              data: message.data,
              priority: message.priority || "normal",
            });
          }

          if (user.webPushSubscription) {
            try {
              await webpush.sendNotification(
                user.webPushSubscription,
                JSON.stringify({
                  title: message.title,
                  body: message.body,
                  data: message.data,
                  icon: "/icons/notification-icon.png",
                  badge: "/icons/notification-badge.png",
                })
              );
            } catch (error) {
              console.error("Error sending web push notification:", error);
              if (error.statusCode === 410) {
                await User.findByIdAndUpdate(user._id, {
                  $unset: { webPushSubscription: 1 },
                });
              }
            }
          }
        }
      }

      if (notifications.length > 0) {
        const chunks = expo.chunkPushNotifications(notifications);
        const tickets = [];

        for (const chunk of chunks) {
          try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);

            tickets.push(...ticketChunk);
          } catch (error) {
            console.error("Error sending chunk:", error);
          }
        }

        return tickets;
      }

      return true;
    } catch (error) {
      console.error("Error in broadcastToLocation:", error);

      return false;
    }
  },

  isWithinRadius(point1, point2, radius) {
    if (!point1 || !point2) {
      return false;
    }

    const lat1 = parseFloat(point1.latitude);
    const lon1 = parseFloat(point1.longitude);
    const lat2 = parseFloat(point2.latitude);
    const lon2 = parseFloat(point2.longitude);

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radius;
  },

  toRad(value) {
    return (value * Math.PI) / 180;
  },
};
