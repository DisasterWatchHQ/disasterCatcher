import Warning from "../models/warning.js";
import { createSystemLog } from "./adminLogsController.js";
import { notificationController } from "./notificationController.js";

const createWarning = async (req, res) => {
  try {
    const {
      title,
      disaster_category,
      description,
      affected_locations,
      severity,
    } = req.body;

    if (
      !title ||
      !disaster_category ||
      !description ||
      !affected_locations ||
      !severity
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: title, disaster_category, description, affected_locations, and severity are required",
      });
    }

    const invalidLocations = affected_locations.filter(
      (location) =>
        !location.address?.city ||
        !location.address?.district ||
        !location.address?.province,
    );

    if (invalidLocations.length > 0) {
      return res.status(400).json({
        error:
          "All locations must include address with city, district, and province",
      });
    }

    const validCategories = [
      "flood",
      "fire",
      "earthquake",
      "landslide",
      "cyclone",
    ];
    if (!validCategories.includes(disaster_category)) {
      return res.status(400).json({
        error: "Invalid disaster category",
      });
    }

    if (req.body.images) {
      const invalidImages = req.body.images.filter(
        (url) => !url.startsWith("http"),
      );
      if (invalidImages.length > 0) {
        return res.status(400).json({
          error: "All images must be valid URLs starting with 'http'",
        });
      }
    }

    const warningData = {
      ...req.body,
      created_by: req.user._id,
      status: "active",
    };

    const newWarning = await Warning.create(warningData);

    notificationController.broadcast(
      {
        type: "NEW_WARNING",
        title: title,
        severity: severity,
        disaster_category: disaster_category,
        affected_locations: affected_locations,
        warningId: newWarning._id,
      },
      affected_locations[0],
    );

    res.status(201).json(newWarning);
  } catch (error) {
    console.error("Error in createWarning:", error);
    res.status(500).json({ error: error.message });
  }
};

const addWarningUpdate = async (req, res) => {
  try {
    const { update_text, severity_change } = req.body;
    const warningId = req.params.id;

    if (!update_text) {
      return res.status(400).json({
        error: "Update text is required",
      });
    }

    const warning = await Warning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ error: "Warning not found" });
    }

    if (warning.status === "resolved") {
      return res.status(400).json({
        error: "Cannot update a resolved warning",
      });
    }

    const updateData = {
      update_text,
      updated_at: new Date(),
      updated_by: req.user._id,
    };

    if (
      severity_change &&
      ["low", "medium", "high", "critical"].includes(severity_change)
    ) {
      updateData.severity_change = severity_change;
      warning.severity = severity_change;
    }

    warning.updates.push(updateData);
    const updatedWarning = await warning.save();

    notificationController.broadcast(
      {
        type: "WARNING_UPDATE",
        warningId: warningId,
        title: warning.title,
        update: update_text,
        severity_change: severity_change,
        affected_locations: warning.affected_locations,
      },
      warning.affected_locations[0],
    );

    res.status(200).json(updatedWarning);
  } catch (error) {
    console.error("Error in addWarningUpdate:", error);
    res.status(500).json({ error: error.message });
  }
};

const addResponseAction = async (req, res) => {
  try {
    const { action_type, description } = req.body;
    const warningId = req.params.id;

    if (!action_type || !description) {
      return res.status(400).json({
        error: "Action type and description are required",
      });
    }

    const warning = await Warning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ error: "Warning not found" });
    }

    if (warning.status === "resolved") {
      return res.status(400).json({
        error: "Cannot add actions to a resolved warning",
      });
    }

    const actionData = {
      action_type,
      description,
      performed_by: req.user._id,
      performed_at: new Date(),
      status: "planned",
    };

    warning.response_actions.push(actionData);
    const updatedWarning = await warning.save();

    notificationController.broadcast(
      {
        type: "RESPONSE_ACTION",
        warningId: warningId,
        title: warning.title,
        action_type: action_type,
        description: description,
        affected_locations: warning.affected_locations,
      },
      warning.affected_locations[0],
    );

    await createSystemLog(
      req.user._id,
      "ADD_WARNING_ACTION",
      "warning",
      warning._id,
      {
        message: `Response action added by ${req.user.name}`,
        action_details: actionData,
      },
    );

    res.status(200).json(updatedWarning);
  } catch (error) {
    console.error("Error in addResponseAction:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateActionStatus = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { status } = req.body;
    const warningId = req.params.id;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    const validStatuses = ["planned", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `${status} is not a valid enum value`,
      });
    }

    const warning = await Warning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ error: "Warning not found" });
    }

    const action = warning.response_actions.id(actionId);
    if (!action) {
      return res.status(404).json({ error: "Action not found" });
    }

    action.status = status;
    const updatedWarning = await warning.save();
    
    notificationController.broadcast(
      {
        type: "UPDATE_ACTION",
        warningId: warningId,
        title: warning.title,
        actionId: actionId,
        status: status,
        affected_locations: warning.affected_locations,
      },
      warning.affected_locations[0],
    );

    await createSystemLog(
      req.user._id,
      "UPDATE_ACTION_STATUS",
      "warning",
      warning._id,
      {
        message: `Action status updated to ${status} by ${req.user.name}`,
        actionId: actionId,
        status: status,
      },
    );

    res.status(200).json(updatedWarning);
  } catch (error) {
    console.error("Error in updateActionStatus:", error);
    res.status(500).json({ error: error.message });
  }
};

const resolveWarning = async (req, res) => {
  try {
    const { resolution_notes } = req.body;
    const warningId = req.params.id;

    if (!resolution_notes) {
      return res.status(400).json({
        error: "Resolution notes are required",
      });
    }

    const warning = await Warning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ error: "Warning not found" });
    }

    warning.status = "resolved";
    warning.resolved_by = req.user._id;
    warning.resolved_at = new Date();
    warning.resolution_notes = resolution_notes;

    const updatedWarning = await warning.save();

    notificationController.broadcast(
      {
        type: "WARNING_RESOLVED",
        warningId: warningId,
        title: warning.title,
        resolution_notes: resolution_notes,
        affected_locations: warning.affected_locations,
      },
      warning.affected_locations[0],
    );

    await createSystemLog(req.user._id, "RESOLVE_WARNING", "warning", warning._id, {
      message: `Warning resolved by ${req.user.name}`,
      resolution_notes,
    });

    res.status(200).json(updatedWarning);
  } catch (error) {
    console.error("Error in resolveWarning:", error);
    res.status(500).json({ error: error.message });
  }
};

const getWarnings = async (req, res) => {
  try {
    const {
      disaster_category,
      status,
      severity,
      city,
      district,
      province,
      limit = 10,
      page = 1,
    } = req.query;

    const query = {};

    if (disaster_category) query.disaster_category = disaster_category;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    if (city || district || province) {
      if (city)
        query["affected_locations.address.city"] = {
          $regex: city,
          $options: "i",
        };
      if (district)
        query["affected_locations.address.district"] = {
          $regex: district,
          $options: "i",
        };
      if (province)
        query["affected_locations.address.province"] = {
          $regex: province,
          $options: "i",
        };
    }

    const warnings = await Warning.find(query)
      .populate("created_by", "name workId associated_department")
      .populate("resolved_by", "name workId associated_department")
      .populate("updates.updated_by", "name workId associated_department")
      .populate(
        "response_actions.performed_by",
        "name workId associated_department",
      )
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Warning.countDocuments(query);

    res.status(200).json({
      warnings,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalWarnings: total,
    });
  } catch (error) {
    console.error("Error in getWarnings:", error);
    res.status(500).json({ error: error.message });
  }
};

const getWarningById = async (req, res) => {
  try {
    const warning = await Warning.findById(req.params.id)
      .populate("created_by", "name workId associated_department")
      .populate("resolved_by", "name workId associated_department")
      .populate("updates.updated_by", "name workId associated_department")
      .populate(
        "response_actions.performed_by",
        "name workId associated_department",
      );

    if (!warning) {
      return res.status(404).json({ error: "Warning not found" });
    }

    res.status(200).json(warning);
  } catch (error) {
    console.error("Error in getWarningById:", error);
    res.status(500).json({ error: error.message });
  }
};

const getActiveWarnings = async (req, res) => {
  try {
    const warnings = await Warning.find({
      status: { $in: ["active", "monitoring"] },
    })
      .select(
        "title disaster_category severity affected_locations status updates response_actions created_at",
      )
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: warnings,
    });
  } catch (error) {
    console.error("Error in getActiveWarnings:", error);
    res.status(500).json({ error: error.message });
  }
};

const getWarningsByLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
      });
    }

    const warnings = await Warning.find({
      status: { $in: ["active", "monitoring"] },
    }).lean();

    const nearbyWarnings = warnings.filter((warning) => {
      return warning.affected_locations.some((location) =>
        isWithinRadius(
          { latitude, longitude },
          {
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
          },
          radius,
        ),
      );
    });

    res.status(200).json({
      success: true,
      data: nearbyWarnings,
    });
  } catch (error) {
    console.error("Error in getWarningsByLocation:", error);
    res.status(500).json({ error: error.message });
  }
};

function isWithinRadius(point1, point2, radius) {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = parseFloat(point1.latitude);
  const lon1 = parseFloat(point1.longitude);
  const lat2 = parseFloat(point2.latitude);
  const lon2 = parseFloat(point2.longitude);

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radius;
}

const updateWarning = async (req, res) => {
  try {
    const { status } = req.body;
    const warningId = req.params.id;

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    const validStatuses = ["active", "monitoring", "resolved", "archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    const warning = await Warning.findById(warningId);
    if (!warning) {
      return res.status(404).json({ error: "Warning not found" });
    }

    warning.status = status;
    const updatedWarning = await warning.save();

    notificationController.broadcast(
      {
        type: "WARNING_STATUS_UPDATE",
        warningId: warningId,
        title: warning.title,
        status: status,
        affected_locations: warning.affected_locations,
      },
      warning.affected_locations[0],
    );

    await createSystemLog(
      req.user._id,
      "UPDATE_WARNING_STATUS",
      "warning",
      warning._id,
      {
        message: `Warning status updated to ${status} by ${req.user.name}`,
        status: status,
      },
    );

    res.status(200).json(updatedWarning);
  } catch (error) {
    console.error("Error in updateWarning:", error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createWarning,
  addWarningUpdate,
  addResponseAction,
  updateActionStatus,
  resolveWarning,
  getWarnings,
  getWarningById,
  getActiveWarnings,
  getWarningsByLocation,
  updateWarning
};
