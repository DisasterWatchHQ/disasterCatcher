import { pushNotificationService } from '../services/pushNotificationService.js';

export const notificationController = {
  broadcast: async (message, location = null, radius = 50) => {
    // Send push notifications to mobile clients
    if (location) {
      return await pushNotificationService.broadcastToLocation(location, message, radius);
    }
    return [];
  },

  sendToUser: async (userId, message) => {
    return await pushNotificationService.sendPushNotification(userId, message);
  }
};