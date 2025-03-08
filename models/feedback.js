import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    feedback_type: {
      type: String,
      required: true,
      enum: ["bug", "feature_request", "improvement", "other"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected"],
      default: "pending",
    },
    admin_response: {
      message: String,
      responded_by: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      responded_at: Date,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
