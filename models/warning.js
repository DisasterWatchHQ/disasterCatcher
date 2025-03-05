import mongoose, { Schema } from "mongoose";

const locationSchema = new Schema({
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },
  address: {
    city: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true },
    details: { type: String },
  },
});

const warningUpdateSchema = new Schema({
  update_text: { type: String, required: true },
  severity_change: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: false
  },
  updated_at: { type: Date, default: Date.now }
});

const responseActionSchema = new Schema({
  action_type: { 
    type: String, 
    enum: ["evacuation", "rescue", "relief", "containment", "other"],
    required: true 
  },
  description: { type: String, required: true },
  performed_at: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["planned", "in_progress", "completed"],
    default: "planned"
  }
});

const warningSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  disaster_category: {
    type: String,
    required: true,
    enum: ["flood", "fire", "earthquake", "landslide", "cyclone"]
  },

  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: true
  },
  expected_duration: {
    start_time: { type: Date, required: true, default: Date.now },
    end_time: { type: Date }
  },

  affected_locations: {
    type: [locationSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: "At least one affected location must be specified"
    }
  },

  status: {
    type: String,
    enum: ["active", "monitoring", "resolved"],
    default: "active"
  },

  related_reports: [{
    type: Schema.Types.ObjectId,
    ref: "UserReports"
  }],

  updates: [warningUpdateSchema],
  response_actions: [responseActionSchema],

  created_by: { 
    type: Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  created_at: { type: Date, default: Date.now },
  resolved_by: { 
    type: Schema.Types.ObjectId, 
    ref: "User"
  },
  resolved_at: { type: Date },
  resolution_notes: { type: String },

  images: {
    type: [String],
    validate: {
      validator: function(v) {
        return !v.length || v.every(url => typeof url === "string" && url.startsWith("http"));
      },
      message: "All images must be valid URLs"
    }
  }
}, { timestamps: true });

warningSchema.index({ status: 1 });
warningSchema.index({ created_by: 1 });
warningSchema.index({ severity: 1 });
warningSchema.index({ disaster_category: 1 });
warningSchema.index({ "affected_locations.address.city": 1 });
warningSchema.index({ "affected_locations.address.district": 1 });
warningSchema.index({ "affected_locations.address.province": 1 });
warningSchema.index({ created_at: -1 });

warningSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

warningSchema.pre("save", function(next) {
  if (this.isModified("status") && this.status === "resolved") {
    this.resolved_at = new Date();

    if (!this.resolution_notes) {
      const err = new Error("Resolution notes are required when marking a warning as resolved");
      return next(err);
    }
  }
  next();
});

const Warning = mongoose.model("Warning", warningSchema);
export default Warning;