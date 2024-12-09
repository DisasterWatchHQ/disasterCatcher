import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const locationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
});

const userSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
  lowercase: true,
  trim: true,
   match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  type: { 
    type: String, 
    required: true, 
    enum: {
      values: ["registered", "verified", "anonymous", "admin"],
      message: '{VALUE} is not supported'
    },
    default: "anonymous" 
  },
  location: locationSchema,
  associated_department: { 
    type: String, 
    enum: {
      values: ["Fire Department", "Police", "Disaster Response Team"],
      message: '{VALUE} is not a valid department'
    }
  },
  verification_status: { 
    type: Boolean, 
    default: false 
  },
  lastLogin: {
    type: Date
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// JSON transform
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

/// Indexes
userSchema.index({ email: 1 });
userSchema.index({ type: 1 });
userSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

const User = mongoose.model('User', userSchema);
export default User;