import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const locationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
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
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
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
    location: locationSchema,
    associated_department: {
      type: String,
      enum: {
        values: ["Fire Department", "Police", "Disaster Response Team"],
        message: "{VALUE} is not a valid department",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

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
  delete userObject.__v;
  return userObject;
};

userSchema.index(
  { "location.latitude": 1, "location.longitude": 1 },
  { sparse: true },
);
userSchema.index({ workId: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
export default User;
