import mongoose, { Schema } from 'mongoose';

const LocationSchema = new Schema({
  current_location: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  geohash: { type: String, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

LocationSchema.index({ current_location: 1 });

LocationSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

LocationSchema.set('toObject', {
  transform: (document, returnedObject, options) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

LocationSchema.set('toString', {
  transform: (document, returnedObject, options) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});
const Location = mongoose.model('Location', LocationSchema);
export default Location;
