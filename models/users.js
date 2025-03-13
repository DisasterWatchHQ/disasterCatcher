import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const locationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

const userPreferencesSchema = new Schema({
  notifications: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    radius: { type: Number, default: 50 }, // km
  },
  theme: {
    mode: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
  },
  language: { type: String, default: "en" },
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    workId: {
      type: String,
      required: [true, "Work ID is required"],
      unique: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarUpdatedAt: {
      type: Date,
      default: null,
    },
    location: locationSchema,
    associated_department: {
      type: String,
      enum: {
        values: ["Fire Department", "Police", "Disaster Response Team"],
        message: "{VALUE} is not a valid department",
      },
    },
    role: {
      type: String,
      enum: ["public", "official"],
      default: "public",
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      type: userPreferencesSchema,
      default: () => ({}),
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    pushToken: String,
    webPushSubscription: Object, // For web push notifications
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Password reset methods
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.__v;

  return userObject;
};

userSchema.index({ "location.latitude": 1, "location.longitude": 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);

export default User;
