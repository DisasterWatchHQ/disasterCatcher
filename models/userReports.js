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

const verificationSchema = new Schema({
  verified_by: { type: Schema.Types.ObjectId, ref: "User" },
  verified_at: { type: Date },
  workId: { type: String },
  associated_department: { type: String },
  verification_time: { type: Number },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    required: function () {
      return this.verification_status === "verified";
    },
  },
  notes: { type: String },
});

const userReportSchema = new Schema(
  {
    title: { type: String, required: true },
    disaster_category: {
      type: String,
      required: true,
      enum: ["flood", "fire", "earthquake", "landslide", "cyclone"],
    },
    description: { type: String, required: true },
    location: { type: locationSchema, required: true },
    date_time: { type: Date, default: Date.now },
    images: {
      type: [String],
      validate: {
        validator: function(v) {
          return !v.length || v.every(url => typeof url === 'string');
        },
        message: 'All images must be valid paths or URLs'
      },
      required: false
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reporter_type: {
      type: String,
      enum: ["anonymous", "registered"],
      default: "anonymous",
    },
    verification_status: {
      type: String,
      enum: ["pending", "verified", "dismissed"],
      default: function () {
        return this.reporter ? "verified" : "pending";
      },
    },
    verification: {
      type: verificationSchema,
      required: function () {
        return this.verification_status === "verified";
      },
    },
  },
  { timestamps: true },
);

userReportSchema.index({ reporter: 1 });
userReportSchema.index({ reporter_type: 1 });
userReportSchema.index({ verification_status: 1 });
userReportSchema.index({ "verification.severity": 1 });
userReportSchema.index({ "verification.verified_by": 1 });

userReportSchema.index({ "location.address.city": 1 });
userReportSchema.index({ "location.address.district": 1 });
userReportSchema.index({ "location.address.province": 1 });
userReportSchema.index({ disaster_category: 1 });
userReportSchema.index({ date_time: -1 });

userReportSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

userReportSchema.pre("save", function (next) {
  if (this.isNew && this.reporter) {
    this.reporter_type = "registered";
    this.verification_status = "verified";
    this.verification = {
      verified_by: this.reporter,
      verified_at: new Date(),
      severity: "medium",
    };
  }
  next();
});

const UserReports = mongoose.model("UserReports", userReportSchema);
export default UserReports;
