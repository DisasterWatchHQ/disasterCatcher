import Resource from "../models/resources.js";
import { createSystemLog } from "./adminLogsController.js";

export const createResource = async (req, res) => {
  try {
    const {
      name,
      category,
      type,
      description,
      location,
      contact,
      availabilityStatus,
      content,
      metadata,
      tags,
      operatingHours,
      capacity,
      emergency_level,
    } = req.body;

    const resourceData = {
      name,
      category,
      type,
      contact,
      added_by: req.user.id,
      status: "active",
      tags: tags || [],
      metadata: metadata || {},
    };

    if (category === "facility") {
      const locationData = {
        type: "address",
        address: {
          formatted_address: location.address.formatted_address,
          city: location.address.city,
          district: location.address.district,
          province: location.address.province,
          details: location.address.details,
        },
      };

      resourceData.location = locationData;
      resourceData.availability_status = availabilityStatus;
      resourceData.operating_hours = operatingHours;
      if (type === "shelter") {
        resourceData.capacity = capacity;
      }
    }

    if (category === "guide") {
      resourceData.description = description;
      resourceData.content = content;
    }

    if (category === "emergency_contact") {
      resourceData.emergency_level = emergency_level;
    }

    const resource = new Resource(resourceData);
    const savedResource = await resource.save();

    await createSystemLog(req.user.id, "CREATE_RESOURCE", "resource", resource._id, {
      new_state: resource.toObject(),
      message: `New resource ${resource.name} was created`,
    });

    res.status(201).json({
      success: true,
      data: savedResource,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const getFacilities = async (req, res) => {
  try {
    const {
      type,
      availabilityStatus,
      city,
      district,
      province,
      status,
      tags,
      limit = 10,
      page = 1,
    } = req.query;

    const query = {
      category: "facility",
      status: status || "active",
    };

    if (type) {
      query.type = type;
    }
    if (availabilityStatus) {
      query.availability_status = availabilityStatus;
    }
    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    if (city || district || province) {
      if (city) {
        query["location.address.city"] = { $regex: city, $options: "i" };
      }
      if (district) {
        query["location.address.district"] = { $regex: district, $options: "i" };
      }
      if (province) {
        query["location.address.province"] = { $regex: province, $options: "i" };
      }
    }

    const skip = (page - 1) * limit;

    const resources = await Resource.find(query)
      .populate("added_by", "name email")
      .sort({ last_verified: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Resource.countDocuments(query);

    res.status(200).json({
      success: true,
      resources,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalResults: total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGuides = async (req, res) => {
  try {
    const { type, tags, limit = 10, page = 1 } = req.query;

    const query = {
      category: "guide",
      status: "active",
    };

    if (type) {
      query.type = type;
    }
    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    const skip = (page - 1) * limit;

    const resources = await Resource.find(query)
      .populate("added_by", "name email")
      .sort({ last_verified: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Resource.countDocuments(query);

    res.status(200).json({
      success: true,
      resources,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalResults: total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmergencyContacts = async (req, res) => {
  try {
    const { emergency_level } = req.query;

    const query = {
      category: "emergency_contact",
      status: "active",
    };

    if (emergency_level) {
      query.emergency_level = emergency_level;
    }

    const resources = await Resource.find(query)
      .populate("added_by", "name email")
      .sort({ emergency_level: -1 });

    res.status(200).json({
      success: true,
      resources,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("added_by", "name email");

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      last_verified: new Date(),
    };

    // Ensure location has the correct structure
    if (updateData.location) {
      updateData.location = {
        address: updateData.location.address || {},
      };
    }

    const updatedResource = await Resource.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("added_by", "name email");

    await createSystemLog(req.user.id, "UPDATE_RESOURCE", "resource", resource._id, {
      previous_state: resource.toObject(),
      new_state: updatedResource.toObject(),
      message: `Resource ${resource.name} was updated`,
    });

    res.status(200).json({
      success: true,
      resource: updatedResource,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({
      error: error.message,
      details: error.errors,
    });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    await Resource.findByIdAndDelete(req.params.id);

    await createSystemLog(req.user.id, "DELETE_RESOURCE", "resource", resource._id, {
      previous_state: resource.toObject(),
      message: `Resource ${resource.name} was deleted`,
    });

    res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
