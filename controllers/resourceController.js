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
      availability_status,
      content,
      metadata,
      tags,
      operating_hours,
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
      let locationData = {
        type: location.type,
      };

      if (location.type === "point") {
        locationData.coordinates = location.coordinates.map((coord) =>
          parseFloat(coord),
        );
      }

      if (location.address) {
        locationData.address = {
          formatted_address: location.address.formatted_address,
          city: location.address.city,
          district: location.address.district,
          province: location.address.province,
          details: location.address.details,
        };
      }

      resourceData.location = locationData;
      resourceData.availability_status = availability_status;
      resourceData.operating_hours = operating_hours;
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
    await createSystemLog(
      req.user.id,
      "CREATE_RESOURCE",
      "resource",
      resource._id,
      {
        new_state: resource.toObject(),
        message: `New resource ${resource.name} was created`,
      },
    );

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
      availability_status,
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

    if (type) query.type = type;
    if (availability_status) query.availability_status = availability_status;
    if (tags) query.tags = { $in: tags.split(",") };

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

    if (type) query.type = type;
    if (tags) query.tags = { $in: tags.split(",") };

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

    if (emergency_level) query.emergency_level = emergency_level;

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

export const getNearbyFacilities = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      maxDistance = 10000,
      type,
      availability_status,
    } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const query = {
      category: "facility",
      status: "active",
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(maxDistance),
        },
      },
    };

    if (type) query.type = type;
    if (availability_status) query.availability_status = availability_status;

    const resources = await Resource.find(query).populate(
      "added_by",
      "name email",
    );

    res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate(
      "added_by",
      "name email",
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const originalResource = await Resource.findById(req.params.id);
    if (!originalResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if user is authorized to update
    // if (
    //   req.user.type !== "admin" &&
    //   originalResource.added_by.toString() !== req.user.id
    // ) {
    //   return res
    //     .status(403)
    //     .json({ message: "Not authorized to update this resource" });
    // }

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate("added_by", "name email");

    await createSystemLog(
      req.user.id,
      "UPDATE_RESOURCE",
      "resource",
      updatedResource._id,
      {
        previous_state: originalResource.toObject(),
        new_state: updatedResource.toObject(),
        message: `Resource ${updatedResource.name} was updated`,
      },
    );

    res.status(200).json({
      success: true,
      data: updatedResource,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if user is authorized to delete
    // if (
    //   req.user.type !== "admin" &&
    //   resource.added_by.toString() !== req.user.id
    // ) {
    //   return res
    //     .status(403)
    //     .json({ message: "Not authorized to delete this resource" });
    // }

    await Resource.findByIdAndDelete(req.params.id);

    await createSystemLog(
      req.user.id,
      "DELETE_RESOURCE",
      "resource",
      resource._id,
      {
        previous_state: resource.toObject(),
        message: `Resource ${resource.name} was deleted`,
      },
    );

    res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
