import mongoose, { Schema } from 'mongoose';

// Updated location schema to include general location
const locationSchema = new Schema({
  latitude: { type: Number, required: false }, // Made optional
  longitude: { type: Number, required: false }, // Made optional
  address: {
    city: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true },
    details: { type: String } // Optional additional details
  }
});

const userReportSchema = new Schema({
  title: { type: String, required: true },
  disaster_category: {
    type: String,
    required: true,
    enum: ['flood', 'fire', 'earthquake', 'landslide', 'cyclone']
  },
  description: { type: String, required: true },
  location: { type: locationSchema, required: true },
  date_time: { type: Date, default: Date.now },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  images: {
    type: [String],
    validate: {
      validator: function(v) {
        return !v.length || v.every(url => typeof url === 'string' && url.startsWith('http'));
      },
      message: 'All images must be valid URLs'
    },
    required: false // Made optional
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'dismissed'],
    default: 'pending'
  }
}, { timestamps: true });

// Indexes for better query performance
userReportSchema.index({ 'location.address.city': 1 });
userReportSchema.index({ 'location.address.district': 1 });
userReportSchema.index({ 'location.address.province': 1 });
userReportSchema.index({ disaster_category: 1 });
userReportSchema.index({ status: 1 });
userReportSchema.index({ date_time: -1 });

// Transform output
userReportSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

const UserReports = mongoose.model('UserReports', userReportSchema);
export default UserReports;