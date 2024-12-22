import AdminLog from '../models/adminLogs.js';

export const createSystemLog = async (userId, action, targetType, targetId, details) => {
  try {
    // Map targetType to match enum values
    const mappedTargetType = {
      'user_report': 'user_report',
      'incident_report': 'incident_report',
      'resource': 'resource',
      'user': 'user'
    }[targetType];

    if (!mappedTargetType) {
      console.error(`Invalid target type: ${targetType}`);
      return null;
    }

    const log = await AdminLog.create({
      admin_id: userId,  // Changed from user_id to admin_id
      action: action,
      target_type: mappedTargetType,
      target_id: targetId,
      // details: details
    });

    return log;
  } catch (error) {
    console.error('Error creating admin log:', error);
    // Don't throw the error - just log it
    return null;
  }
};

export const getAdminLogs = async (req, res) => {
  try {
    const {
      action,
      target_type,
      startDate,
      endDate,
      admin_id,
      limit = 50,
      page = 1
    } = req.query;

    const query = {};

    if (action) query.action = action;
    if (target_type) query.target_type = target_type;
    if (admin_id) query.admin_id = admin_id;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await AdminLog.find(query)
      .populate('admin_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AdminLog.countDocuments(query);

    res.status(200).json({
      logs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalLogs: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAdminLogById = async (req, res) => {
  try {
    const log = await AdminLog.findById(req.params.id)
      .populate('admin_id', 'name email');
    
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};