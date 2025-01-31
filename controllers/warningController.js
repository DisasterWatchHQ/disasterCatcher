import Warning from "../models/warning.js";
import { createSystemLog } from "./adminLogsController.js";

// Create a new warning
export const createWarning = async (req, res) => {
  try {
    const {
      title,
      disaster_category,
      description,
      affected_locations,
      severity,
      created_by,
    } = req.body;

    if (!created_by) {
      return res.status(401).json({
        error: "User ID is required to create warnings",
      });
    }

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

    // Validate locations
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
      status: "active",
    };

    const newWarning = await Warning.create(warningData);

    await createSystemLog(
      created_by,
      "CREATE_WARNING",
      "warning",
      newWarning._id,
      {
        message: `New warning created with ID ${newWarning._id}`,
      },
    );

    res.status(201).json(newWarning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add update to existing warning
export const addWarningUpdate = async (req, res) => {
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
      updated_at: new Date()
    };

    if (severity_change && ['low', 'medium', 'high', 'critical'].includes(severity_change)) {
      updateData.severity_change = severity_change;
      warning.severity = severity_change;
    }

    warning.updates.push(updateData);
    const updatedWarning = await warning.save();

    res.status(200).json(updatedWarning);
  } catch (error) {
    console.error('Error in addWarningUpdate:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add response action to warning
export const addResponseAction = async (req, res) => {
  try {
    const { action_type, description } = req.body;
    const warningId = req.params.id;
    const user = req.user;

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
      performed_by: user._id,
      performed_at: new Date(),
      status: "planned",
    };

    warning.response_actions.push(actionData);
    const updatedWarning = await warning.save();

    await createSystemLog(
      user._id,
      "ADD_WARNING_ACTION",
      "warning",
      warning._id,
      {
        message: `Response action added by ${user.name}`,
        action_details: actionData,
      },
    );

    res.status(200).json(updatedWarning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update response action status
export const updateActionStatus = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { status } = req.body;
    const warningId = req.params.id;
    const user = req.user;

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

    await createSystemLog(
      user._id,
      "UPDATE_ACTION_STATUS",
      "warning",
      warning._id,
      {
        message: `Action status updated by ${user.name}`,
        action_id: actionId,
        new_status: status,
      },
    );

    res.status(200).json(updatedWarning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Resolve warning
export const resolveWarning = async (req, res) => {
  try {
    const { resolution_notes } = req.body;
    const warningId = req.params.id;
    const user = req.user;

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
    warning.resolved_by = user._id;
    warning.resolved_at = new Date();
    warning.resolution_notes = resolution_notes;

    const updatedWarning = await warning.save();

    await createSystemLog(user._id, "RESOLVE_WARNING", "warning", warning._id, {
      message: `Warning resolved by ${user.name}`,
      resolution_notes,
    });

    res.status(200).json(updatedWarning);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get warnings with filters
export const getWarnings = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};

// Get warning by ID
export const getWarningById = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};

// Get active warnings for public feed
export const getActiveWarnings = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};
