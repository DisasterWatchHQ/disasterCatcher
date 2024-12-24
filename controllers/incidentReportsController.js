import IncidentReports from "../models/incidentReport.js";
import { createSystemLog } from "./adminLogsController.js";

export const createIncidentReport = async (req, res) => {
  try {
    // Check authorization
    if (req.user.type !== "admin" && req.user.type !== "verified") {
      return res.status(403).json({
        message: "Only admin and verified users can create incident reports",
      });
    }

    const {
      title,
      disaster_category,
      description,
      location,
      date_time,
      severity,
      response_status,
      images,
    } = req.body;

    // Create the report
    const newReport = await IncidentReports.create({
      title,
      disaster_category,
      description,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: {
          city: location.address.city,
          district: location.address.district,
          province: location.address.province,
          details: location.address.details,
        },
      },
      date_time,
      user_id: req.user.id,
      severity,
      response_status,
      images,
      verified_by: [req.user.id], // Initial verification by creator
    });

    // Create system log
    await createSystemLog(
      req.user.id,
      "CREATE_INCIDENT_REPORT",
      "incident_report",
      newReport._id, // Changed from report._id to newReport._id
      {
        new_state: newReport.toObject(),
        message: `New incident report ${newReport.title} was created`,
      },
    );

    // Populate and return the response
    const populatedReport = await newReport.populate("user_id", "name email");
    res.status(201).json(populatedReport);
  } catch (error) {
    console.log("Create Incident Report Error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getIncidentReports = async (req, res) => {
  try {
    const {
      disaster_category,
      severity,
      response_status,
      city,
      district,
      province,
      startDate,
      endDate,
      limit = 10,
      page = 1,
    } = req.query;

    // Build query
    const query = {};

    // Add filters if they exist
    if (disaster_category) query.disaster_category = disaster_category;
    if (severity) query.severity = severity;
    if (response_status) query.response_status = response_status;

    // Location filters
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

    // Date range filter
    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) query.date_time.$gte = new Date(startDate);
      if (endDate) query.date_time.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    const reports = await IncidentReports.find(query)
      .populate("user_id", "name email")
      .populate("verified_by", "name email")
      .sort({ date_time: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await IncidentReports.countDocuments(query);

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

// Get reports near a location
export const getNearbyIncidents = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const reports = await IncidentReports.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).populate("user_id", "name email");

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getIncidentReportById = async (req, res) => {
  try {
    const report = await IncidentReports.findById(req.params.id)
      .populate("user_id", "name email")
      .populate("verified_by", "name email");

    if (!report)
      return res.status(404).json({ message: "Incident report not found" });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateIncidentReport = async (req, res) => {
  try {
    const report = await IncidentReports.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Incident report not found" });
    }

    // Check authorization
    if (
      req.user.type !== "admin" &&
      report.user_id.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this report" });
    }

    const originalReport = report.toObject();
    const updatedReport = await IncidentReports.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true },
    )
      .populate("user_id", "name email")
      .populate("verified_by", "name email");

    if (typeof createSystemLog === "function") {
      await createSystemLog(
        req.user.id,
        "UPDATE_INCIDENT_REPORT",
        "incident_report",
        updatedReport._id,
        {
          previous_state: originalReport,
          new_state: updatedReport.toObject(),
          message: `Incident report ${updatedReport.title} was updated`,
        },
      );
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteIncidentReport = async (req, res) => {
  try {
    const report = await IncidentReports.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Incident report not found" });
    }

    // Check authorization
    if (
      req.user.type !== "admin" &&
      report.user_id.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this report" });
    }

    await IncidentReports.findByIdAndDelete(req.params.id);

    if (typeof createSystemLog === "function") {
      await createSystemLog(
        req.user.id,
        "DELETE_INCIDENT_REPORT",
        "incident_report",
        report._id,
        {
          previous_state: report.toObject(),
          message: `Incident report ${report.title} was deleted`,
        },
      );
    }

    res.status(200).json({ message: "Incident report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
