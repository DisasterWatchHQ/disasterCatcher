import { Expo } from 'expo-server-sdk';
const expo = new Expo();

export const sendPushNotification = async (expoPushToken, notification) => {
  try {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
      return;
    }

    const messages = [{
      to: expoPushToken,
      sound: 'default',
      title: notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
      body: notification.message,
      data: { 
        type: notification.type,
        priority: notification.priority,
        notificationId: notification.id
      },
    }];

    const chunks = expo.chunkPushNotifications(messages);
    
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
};