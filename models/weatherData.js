import mongoose, { Schema } from 'mongoose';

// Weather alert/anomaly schema
const weatherAlertSchema = new Schema({
  type: { type: String, required: true }, // e.g., 'storm', 'flood', 'extreme_temperature'
  severity: { type: String, required: true, enum: ['low', 'medium', 'high'] },
  description: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date }
});
const forecastSchema = new Schema({
  date: { type: Date, required: true },
  temperature: { type: Number, required: true },
  rainfall: { type: Number, required: true },
  wind_speed: { type: Number, required: true }
});

// Main schema for weather data
const weatherDataSchema = new Schema({
  location: {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 }
  },
  current_weather: { type: String, required: true },
  forecast: [forecastSchema], // Array of forecast objects
  last_updated: { type: Date, required: true }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// Geospatial index for location
weatherDataSchema.index({ location: '2dsphere' }); // Enables geospatial queries

// Transform function for cleaner output
weatherDataSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

// Model export
const WeatherData = mongoose.model('WeatherData', weatherDataSchema);
export default WeatherData;
