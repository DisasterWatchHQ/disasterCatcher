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
      'CREATE', 'UPDATE', 'DELETE',
      'CREATE_RESOURCE', 'UPDATE_RESOURCE', 'DELETE_RESOURCE',
      'VERIFY_REPORT', 'UPDATE_REPORT_STATUS', 'DELETE_REPORT',
      'CREATE_INCIDENT_REPORT', 'UPDATE_INCIDENT_REPORT', 'DELETE_INCIDENT_REPORT',
      'CREATE_FEEDBACK', 'UPDATE_FEEDBACK', 'DELETE_FEEDBACK',
      'CREATE_ALERT', 'UPDATE_ALERT', 'DELETE_ALERT',
      'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
      'VERIFY_USER', 'BLOCK_USER', 'UPDATE_USER_STATUS',
      'SYSTEM_UPDATE'
    ]
  },
  target_type: {
    type: String,
    required: true,
    enum: ['resource', 'incident_report', 'user_report', 'user', 'feedback', 'alert', 'system', 'notification', 'subscription']
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