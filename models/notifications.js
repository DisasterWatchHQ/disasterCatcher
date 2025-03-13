import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: {
      type: String,
      required: true,
      minlength: [1, "Message cannot be empty"],
    },
    type: {
      type: String,
      required: true,
      enum: ["alert", "warning", "system_update", "report_validation"],
    },
    status: {
      type: String,
      required: true,
      enum: ["unread", "read"],
      default: "unread",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    source: {
      type: String,
      required: true,
      enum: ["system", "alert_system", "report_system"],
      default: "system",
    },
    metadata: { type: Map, of: Schema.Types.Mixed, default: new Map() },
    pushToken: { type: String },
  },
  { timestamps: true },
);

notificationSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
