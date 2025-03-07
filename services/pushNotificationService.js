import { Expo } from 'expo-server-sdk';
import User from '../models/users.js';

const expo = new Expo();

export const pushNotificationService = {
  async sendPushNotification(userId, message) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushToken || !user.preferences.notifications.push) {
        return false;
      }

      if (!Expo.isExpoPushToken(user.pushToken)) {
        console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
        return false;
      }

      const messages = [{
        to: user.pushToken,
        sound: 'default',
        title: message.title,
        body: message.body,
        data: message.data,
        priority: message.priority || 'normal',
      }];

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
      return false;
    }
  },

  async broadcastToLocation(location, message, radius = 50) {
    try {
      const users = await User.find({
        'location.latitude': { $exists: true },
        'location.longitude': { $exists: true },
        'preferences.notifications.push': true,
      });

      const messages = [];
      for (const user of users) {
        if (this.isWithinRadius(user.location, location, radius)) {
          if (Expo.isExpoPushToken(user.pushToken)) {
            messages.push({
              to: user.pushToken,
              sound: 'default',
              title: message.title,
              body: message.body,
              data: message.data,
              priority: message.priority || 'normal',
            });
          }
        }
      }

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error in broadcastToLocation:', error);
      return false;
    }
  },

  isWithinRadius(point1, point2, radius) {
    if (!point1 || !point2) return false;
    
    const lat1 = parseFloat(point1.latitude);
    const lon1 = parseFloat(point1.longitude);
    const lat2 = parseFloat(point2.latitude);
    const lon2 = parseFloat(point2.longitude);

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= radius;
  },

  toRad(value) {
    return value * Math.PI / 180;
  }
}; 