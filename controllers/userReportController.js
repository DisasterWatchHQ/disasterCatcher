import UserReports from "../models/userReports.js";
import { createSystemLog } from "./adminLogsController.js";

export const createUserReport = async (req, res) => {
  try {
    const report = {
      ...req.body,
      user_id: req.user.id,
      status: "pending",
    };

    if (!report.location.latitude && !report.location.longitude) {
    }

    const newReport = await UserReports.create(report);
    res.status(201).json(newReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    if (disaster_category) query.disaster_category = disaster_category;
    if (status) query.status = status;

    if (city || district || province) {
      if (city)
        query["location.address.city"] = { $regex: city, $options: "i" };
      if (district)
        query["location.address.district"] = {
          $regex: district,
          $options: "i",
        };
      if (province)
        query["location.address.province"] = {
          $regex: province,
          $options: "i",
        };
    }

    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) query.date_time.$gte = new Date(startDate);
      if (endDate) query.date_time.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const reports = await UserReports.find(query)
      .populate("user_id", "name email")
      .sort({ date_time: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await UserReports.countDocuments(query);

    res.status(200).json({
      reports,
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
    const report = await UserReports.findById(req.params.id).populate(
      "user_id",
      "name email",
    );

    if (!report) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserReport = async (req, res) => {
  try {
    const originalReport = await UserReports.findById(req.params.id);

    if (!originalReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only allow update if user is the owner or an admin
    if (
      originalReport.user_id.toString() !== req.user.id &&
      req.user.type !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this report" });
    }

    const updatedReport = await UserReports.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate("user_id", "name email");

    if (req.user.type === "admin") {
      await createSystemLog(
        req.user.id,
        "UPDATE_USER_REPORT",
        "user_report",
        updatedReport._id,
        {
          previous_state: originalReport.toObject(),
          new_state: updatedReport.toObject(),
          message: `User report ${updatedReport.title} was updated`,
        },
      );
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUserReport = async (req, res) => {
  try {
    const report = await UserReports.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only allow deletion if user is the owner or an admin
    if (
      report.user_id.toString() !== req.user.id &&
      req.user.type !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this report" });
    }

    if (req.user.type === "admin") {
      await createSystemLog(
        req.user.id,
        "DELETE_USER_REPORT",
        "user_report",
        report._id,
        {
          previous_state: report.toObject(),
          message: `User report ${report.title} was deleted`,
        },
      );
    }

    await report.deleteOne();
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
