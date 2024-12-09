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

// Pre-save hook to hash passwords
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output to hide sensitive fields
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ type: 1, location: 1 });

const User = mongoose.model('User', userSchema);
export default User;
