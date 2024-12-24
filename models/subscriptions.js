import mongoose, { Schema } from "mongoose";

const DISASTER_TYPES = ["flood", "earthquake", "fire", "landslide", "cyclone"];
const REGIONS = ["Colombo", "Kandy", "Galle", "Jaffna", "Matara"];
const FREQUENCIES = ["instant", "daily", "weekly"];

const subscriptionSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    disaster_types: {
      type: [String],
      required: true,
      validate: {
        validator: (types) =>
          types.every((type) => DISASTER_TYPES.includes(type)),
        message: "Invalid disaster type",
      },
    },
    regions: {
      type: [String],
      required: true,
      validate: {
        validator: (regions) =>
          regions.every((region) => REGIONS.includes(region)),
        message: "Invalid region",
      },
    },
    notification_frequency: {
      type: String,
      required: true,
      enum: FREQUENCIES,
      default: "instant",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
subscriptionSchema.index({ user_id: 1 });
subscriptionSchema.index({ disaster_types: 1 });
subscriptionSchema.index({ regions: 1 });

subscriptionSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
