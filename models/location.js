import mongoose, { Schema } from 'mongoose';

// Define the Location schema
const LocationSchema = new Schema({
  current_location: {
    type: String,
    required: true,
    validate: {
      validator: (value) => value.length >= 2 && value.length <= 100,
      message: 'Location name must be between 2 and 100 characters.'
    }
  },
  address: {
    type: String,
    required: true,
    validate: {
      validator: (value) => value.length >= 5,
      message: 'Address must be at least 5 characters long.'
    }
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  geohash: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Geospatial index
LocationSchema.index({ latitude: 1, longitude: 1 }, { name: 'geoIndex' });

// Case-insensitive unique index for current_location
LocationSchema.index(
  { current_location: 1 }, 
  { 
    unique: true,
    collation: { locale: 'en', strength: 2 }
  }
);

// Pre-save middleware to normalize current_location
LocationSchema.pre('save', function(next) {
  if (this.current_location) {
    this.current_location = this.current_location.trim();
  }
  next();
});

// Transform function
const transformFunction = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
};

LocationSchema.set('toJSON', { transform: transformFunction });
LocationSchema.set('toObject', { transform: transformFunction });

const Location = mongoose.models.Location || mongoose.model('Location', LocationSchema);

export default Location;