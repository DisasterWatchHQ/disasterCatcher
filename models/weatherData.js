import mongoose, { Schema } from 'mongoose';

// Weather alert/anomaly schema
const weatherAlertSchema = new Schema({
  type: { type: String, required: true }, // e.g., 'storm', 'flood', 'extreme_temperature'
  severity: { type: String, required: true, enum: ['low', 'medium', 'high'] },
  description: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date }
});

// Current weather schema
const currentWeatherSchema = new Schema({
  temperature: { type: Number, required: true },
  feels_like: { type: Number, required: true },
  humidity: { type: Number, required: true },
  wind_speed: { type: Number, required: true },
  wind_direction: { type: Number, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }
});

// Forecast schema
const forecastSchema = new Schema({
  date: { type: Date, required: true },
  temperature_max: { type: Number, required: true },
  temperature_min: { type: Number, required: true },
  humidity: { type: Number, required: true },
  wind_speed: { type: Number, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  precipitation_probability: { type: Number, required: true }
});

const weatherDataSchema = new Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    name: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true }
  },
  current_weather: { type: currentWeatherSchema, required: true },
  forecast: [forecastSchema],
  alerts: [weatherAlertSchema],
  last_updated: { type: Date, default: Date.now }
}, { timestamps: true });

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
