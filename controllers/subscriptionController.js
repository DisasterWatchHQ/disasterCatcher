import Subscription from '../models/subscriptions.js';

export const createSubscription = async (req, res) => {
  try {
    // Check if user already has a subscription
    const existingSubscription = await Subscription.findOne({ user_id: req.user.id });
    if (existingSubscription) {
      return res.status(400).json({ 
        message: 'User already has an active subscription' 
      });
    }

    const subscription = await Subscription.create({
      ...req.body,
      user_id: req.user.id
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user_id: req.user.id });
    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { user_id: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    res.status(200).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({ 
      user_id: req.user.id 
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    res.status(200).json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};