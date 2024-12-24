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
      'CREATE_INCIDENT_REPORT',
      'UPDATE_INCIDENT_REPORT',
      'DELETE_INCIDENT_REPORT',
      'VERIFY_REPORT',
      'UPDATE_REPORT_STATUS',
      'CREATE_USER_REPORT',
      'UPDATE_USER_REPORT',
      'DELETE_USER_REPORT',
      'UPDATE_USER_STATUS',
      'DELETE_USER',
      'CREATE_FEEDBACK',
      'UPDATE_FEEDBACK',
      'DELETE_FEEDBACK'
    ]
  },
  target_type: {
    type: String,
    required: true,
    enum: ['resource', 'incident_report', 'user_report', 'user', 'feedback']
  },
  target_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, { 
  timestamps: true 
});

// Indexes
adminLogSchema.index({ admin_id: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ target_type: 1, target_id: 1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;