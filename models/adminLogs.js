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
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
adminLogSchema.index({ admin_id: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ target_type: 1, target_id: 1 });

adminLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;