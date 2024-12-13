import mongoose, { Schema } from 'mongoose';

const adminLogSchema = new Schema({
  admin_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  action: { 
    type: String, 
    required: true, 
    enum: [
      'LOGIN',
      'LOGOUT',
      'CREATE_RESOURCE',
      'UPDATE_RESOURCE',
      'DELETE_RESOURCE',
      'VERIFY_REPORT',
      'UPDATE_REPORT_STATUS',
      'DELETE_REPORT',
      'UPDATE_USER_STATUS'
    ]
  },
  target_type: {
    type: String,
    required: true,
    enum: ['resource', 'incident_report', 'user_report', 'user']
  },
  target_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  details: {
    previous_state: Schema.Types.Mixed,
    new_state: Schema.Types.Mixed,
    message: String
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
adminLogSchema.index({ admin_id: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ target_type: 1, target_id: 1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;