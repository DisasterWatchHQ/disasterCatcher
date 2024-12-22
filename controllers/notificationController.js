import Notification from '../models/notifications.js';

// System methods (not exposed via routes)
export const createSystemNotification = async (userId, message, type, priority = 'medium') => {
  try {
    return await Notification.create({
      user_id: userId,
      message,
      type,
      priority,
      source: 'system'
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    return null;
  }
};

export const createAlertNotification = async (userId, alertData) => {
  try {
    return await Notification.create({
      user_id: userId,
      message: alertData.message,
      type: 'alert',
      priority: alertData.priority || 'high',
      source: 'alert_system',
      metadata: new Map(Object.entries(alertData))
    });
  } catch (error) {
    console.error('Error creating alert notification:', error);
    return null;
  }
};

// Route handlers
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user_id', 'name email');

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
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
      { status: 'read' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, status: 'unread' },
      { status: 'read' }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};