import mongoose, { Schema } from 'mongoose';

const userReportSchema = new Schema({
 
  title: { type: String, required: true },
  disaster_category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: Schema.Types.Mixed, required: true },
  date_time: { type: Date, required: true },
  user_id: { type: Schema.Types.ObjectId, required: true },
  images: { type: Array, required: true },
  status: { type: String, required: true, enums: ['pending', 'verified', 'dismissed'] },
  validations: { type: Array, required: true },
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true }
});

const userReports = mongoose.model('userReports', userReportSchema);
export default userReports;
