import mongoose, { Schema } from "mongoose";

const locationSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ["point", "address"],
  },
  coordinates: {
    type: [Number], //[longitude, latitude]
    index: "2dsphere",
  },
  address: {
    formatted_address: String,
    city: String,
    district: String,
    province: String,
    details: String,
  },
});

const contactSchema = new Schema({
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[\d+\s()-]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  email: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^\S+@\S+\.\S+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
});

const resourceSchema = new Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["facility", "emergency_contact", "guide"],
    },
    type: {
      type: String,
      required: true,
      enum: [
        "hospital",
        "shelter",
        "police_station",
        "fire_station",
        "clinic",
        "emergency_number",
        "disaster_guide",
      ],
    },
    description: {
      type: String,
      required: function () {
        return this.category === "guide";
      },
    },
    location: {
      type: locationSchema,
      required: function () {
        return this.category === "facility";
      },
    },
    contact: {
      type: contactSchema,
      required: true,
    },
    availability_status: {
      type: String,
      required: function () {
        return this.category === "facility";
      },
      enum: ["open", "closed", "under_maintenance"],
    },
    content: {
      type: String,
      required: function () {
        return this.category === "guide";
      },
    },
    added_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      validate: {
        validator: function(v) {
          switch(this.category) {
            case 'facility':
              return v?.capacity !== undefined;
            case 'guide':
              return v?.lastUpdated !== undefined;
            case 'emergency_contact':
              return v?.serviceHours !== undefined;
            default:
              return true;
          }
        },
        message: 'Invalid metadata for resource category'
      }
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    },
    tags: [{
      type: String,
      trim: true
    }],
    operating_hours: {
      type: Map,
      of: {
        open: String,
        close: String,
        is24Hours: Boolean
      }
    },
    capacity: {
      type: Number,
      min: 0,
      required: function() {
        return this.category === 'facility' && this.type === 'shelter';
      }
    },
    emergency_level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: function() {
        return this.category === 'emergency_contact';
      }
    },
    last_verified: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// resourceSchema.index({ "location.coordinates": "2dsphere" });
resourceSchema.index({ category: 1, type: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ status: 1 });

resourceSchema.methods.getAvailability = function() {
  if (this.category === 'facility') {
    return this.availability_status;
  }
  return null;
};

resourceSchema.methods.isOperational = function() {
  return this.status === 'active' && 
    (this.category !== 'facility' || this.availability_status === 'open');
};

resourceSchema.statics.findNearby = async function(coordinates, maxDistance = 5000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

resourceSchema.statics.findByType = async function(type) {
  return this.find({ type, status: 'active' });
};

resourceSchema.statics.findActiveGuides = async function() {
  return this.find({ 
    category: 'guide',
    status: 'active'
  }).sort({ last_verified: -1 });
};

resourceSchema.virtual('isVerified').get(function() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return this.last_verified >= oneMonthAgo;
});

resourceSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.last_verified = new Date();
  }
  next();
});

resourceSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Format dates
    if (ret.last_verified) {
      ret.last_verified = ret.last_verified.toISOString();
    }
    if (ret.createdAt) {
      ret.createdAt = ret.createdAt.toISOString();
    }
    if (ret.updatedAt) {
      ret.updatedAt = ret.updatedAt.toISOString();
    }
  },
});

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;