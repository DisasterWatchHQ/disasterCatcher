import AdminLog from "../models/adminLogs.js";
import logger from "../utils/logger.js";

export const createSystemLog = async (adminId, action, targetType, targetId, details) => {
  try {
    const mappedTargetType = {
      user_report: "user_report",
      incident_report: "incident_report",
      resource: "resource",
      user: "user",
      feedback: "feedback",
    }[targetType];

    if (!mappedTargetType) {
      logger.error(`Invalid target type: ${targetType}`);

      return null;
    }

    const detailsMap = details instanceof Map ? details : new Map(Object.entries(details || {}));

    const log = await AdminLog.create({
      admin_id: adminId,
      action: action,
      target_type: mappedTargetType,
      target_id: targetId,
      details: detailsMap,
    });

    return log;
  } catch (error) {
    logger.error("Error creating admin log:", error);

    return null;
  }
};

export const getAdminLogs = async (req, res) => {
  try {
    const { action, targetType, startDate, endDate, adminId, limit = 50, page = 1 } = req.query;

    const query = {};

    if (action) {
      query.action = action;
    }
    if (targetType) {
      query.target_type = targetType;
    }
    if (adminId) {
      query.admin_id = adminId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const logs = await AdminLog.find(query)
      .populate("admin_id", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AdminLog.countDocuments(query);

    res.status(200).json({
      logs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalLogs: total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAdminLogById = async (req, res) => {
  try {
    const log = await AdminLog.findById(req.params.id).populate("admin_id", "name email");

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
