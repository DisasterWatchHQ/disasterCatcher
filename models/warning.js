import mongoose from "mongoose";

const warningSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    disaster_category: {
      type: String,
      required: true,
      enum: ["flood", "fire", "earthquake", "landslide", "cyclone"],
    },
    description: {
      type: String,
      required: true,
    },
    affected_locations: [
      {
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        address: {
          city: String,
          district: String,
          province: String,
        },
      },
    ],
    severity: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "monitoring", "resolved"],
      default: "active",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolved_at: Date,
    resolution_notes: String,
    updates: [
      {
        update_text: String,
        updated_at: Date,
        updated_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        severity_change: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
      },
    ],
    response_actions: [
      {
        action_type: String,
        description: String,
        performed_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        performed_at: Date,
        status: {
          type: String,
          enum: ["planned", "in_progress", "completed", "cancelled"],
          default: "planned",
        },
      },
    ],
    images: [String],
  },
  {
    timestamps: true,
  }
);

warningSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

const Warning = mongoose.model("Warning", warningSchema);

export default Warning;