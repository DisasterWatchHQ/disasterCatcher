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
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

resourceSchema.index({ "location.coordinates": "2dsphere" });
resourceSchema.index({ category: 1, type: 1 });

resourceSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
