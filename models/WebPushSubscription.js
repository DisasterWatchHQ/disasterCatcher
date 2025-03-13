import mongoose from "mongoose";

const webPushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription: {
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  userAgent: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
webPushSubscriptionSchema.index({ userId: 1 });
webPushSubscriptionSchema.index({ "subscription.endpoint": 1 }, { unique: true });

export default mongoose.model("WebPushSubscription", webPushSubscriptionSchema);
