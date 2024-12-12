import mongoose, { Schema } from 'mongoose';

const locationSchema = new Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['point', 'address'] 
  },
  coordinates: {
    type: [Number], //format -> [longitude, latitude]
    index: '2dsphere'
  },
  address: {
    formatted_address: String,
    city: String,
    district: String,
    province: String,
    details: String
  }
});

//add index for geospatial queries
locationSchema.index({ coordinates: '2dsphere' });

//subschema for contact information
const contactSchema = new Schema({
  phone: { 
    type: String, 
    required: true, 
    validate: {
      validator: function(v) {
        return /^[\d+\s()-]+$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  email: { 
    type: String, 
    required: true, 
    validate: {
      validator: function(v) {
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  }
});

//main schema resources
const resourceSchema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['hospital', 'shelter', 'police station', 'fire station', 'clinic']
  },
  location: { type: locationSchema, required: true },
  contact: { type: contactSchema, required: true },
  availability_status: {
    type: String,
    required: true,
    enum: ['open', 'closed', 'under maintenance']
  }
}, { timestamps: true });

resourceSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;