import UserReports from "../models/userReports.js";
import { createSystemLog } from "./adminLogsController.js";

export const createUserReport = async (req, res) => {
  try {
    const { title, disaster_category, description, location } = req.body;

    if (!title || !disaster_category || !description || !location) {
      return res.status(400).json({
        error: "Missing required fields: title, disaster_category, description, and location are required"
      });
    }

    if (!location.address || !location.address.city || !location.address.district || !location.address.province) {
      return res.status(400).json({
        error: "Location must include address with city, district, and province"
      });
    }

    const validCategories = ["flood", "fire", "earthquake", "landslide", "cyclone"];
    if (!validCategories.includes(disaster_category)) {
      return res.status(400).json({
        error: "Invalid disaster category. Must be one of: flood, fire, earthquake, landslide, cyclone"
      });
    }

    if (req.body.images) {
      const invalidImages = req.body.images.filter(url => !url.startsWith('http'));
      if (invalidImages.length > 0) {
        return res.status(400).json({
          error: "All images must be valid URLs starting with 'http'"
        });
      }
    }

    const report = {
      ...req.body,
      status: "pending",
      date_time: req.body.date_time || new Date(),
    };

    const newReport = await UserReports.create(report);
    res.status(201).json(newReport.toJSON());
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getUserReports = async (req, res) => {
  try {
    const {
      disaster_category,
      city,
      district,
      province,
      startDate,
      endDate,
      status,
      limit = 10,
      page = 1,
    } = req.query;

    const query = {};

    if (disaster_category) {
      const validCategories = ["flood", "fire", "earthquake", "landslide", "cyclone"];
      if (!validCategories.includes(disaster_category)) {
        return res.status(400).json({
          error: "Invalid disaster category. Must be one of: flood, fire, earthquake, landslide, cyclone"
        });
      }
      query.disaster_category = disaster_category;
    }

    if (status) {
      const validStatuses = ["pending", "verified", "dismissed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status. Must be one of: pending, verified, dismissed"
        });
      }
      query.status = status;
    }

    if (city || district || province) {
      if (city) query["location.address.city"] = { $regex: city, $options: "i" };
      if (district) query["location.address.district"] = { $regex: district, $options: "i" };
      if (province) query["location.address.province"] = { $regex: province, $options: "i" };
    }

    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        const startDateTime = new Date(startDate);
        if (isNaN(startDateTime)) {
          return res.status(400).json({ error: "Invalid startDate format" });
        }
        query.date_time.$gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        if (isNaN(endDateTime)) {
          return res.status(400).json({ error: "Invalid endDate format" });
        }
        query.date_time.$lte = endDateTime;
      }
    }

    const skip = (page - 1) * limit;

    const reports = await UserReports.find(query)
      .sort({ date_time: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await UserReports.countDocuments(query);

    res.status(200).json({
      reports: reports.map(report => report.toJSON()),
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalReports: total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserReportById = async (req, res) => {
  try {
    const report = await UserReports.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(report.toJSON());
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid report ID format" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateUserReport = async (req, res) => {
  try {
    const originalReport = await UserReports.findById(req.params.id);

    if (!originalReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only validate fields if they're being updated
    if (req.body.disaster_category) {
      const validCategories = ["flood", "fire", "earthquake", "landslide", "cyclone"];
      if (!validCategories.includes(req.body.disaster_category)) {
        return res.status(400).json({
          error: "Invalid disaster category. Must be one of: flood, fire, earthquake, landslide, cyclone"
        });
      }
    }

    if (req.body.status) {
      const validStatuses = ["pending", "verified", "dismissed"];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({
          error: "Invalid status. Must be one of: pending, verified, dismissed"
        });
      }
    }

    if (req.body.location) {
      const { address } = req.body.location;
      if (address && (!address.city || !address.district || !address.province)) {
        return res.status(400).json({
          error: "Location must include address with city, district, and province"
        });
      }
    }

    if (req.body.images) {
      const invalidImages = req.body.images.filter(url => !url.startsWith('http'));
      if (invalidImages.length > 0) {
        return res.status(400).json({
          error: "All images must be valid URLs starting with 'http'"
        });
      }
    }

    const updatedReport = await UserReports.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    await createSystemLog(
      "SYSTEM",
      "UPDATE_USER_REPORT",
      "user_report",
      updatedReport._id,
      {
        previous_state: originalReport.toJSON(),
        new_state: updatedReport.toJSON(),
        message: `User report ${updatedReport.title} was updated`,
      }
    );

    res.status(200).json(updatedReport.toJSON());
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid report ID format" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteUserReport = async (req, res) => {
  try {
    const report = await UserReports.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    await createSystemLog(
      "SYSTEM",
      "DELETE_USER_REPORT",
      "user_report",
      report._id,
      {
        previous_state: report.toJSON(),
        message: `User report ${report.title} was deleted`,
      }
    );

    await report.deleteOne();
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid report ID format" });
    }
    res.status(500).json({ error: error.message });
  }
};