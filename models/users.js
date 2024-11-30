import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  type: { type: String, required: true, enum: ["normal", "verified", "anonymous"] },
  location: { type: Schema.Types.Mixed, required: false },
  associated_department: { type: String, required: false },
  verification_status: { type: Boolean, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User;

  
 
  
  
  
