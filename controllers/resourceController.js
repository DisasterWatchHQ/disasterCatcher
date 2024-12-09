import Resource from '../models/resources.js';

export const createResource = async (req, res) => {
  try {
    const { name, type, location, contact, availability_status } = req.body;
    const newResource = await Resource.create({ 
      name, 
      type, 
      location, 
      contact, 
      availability_status 
    });
    res.status(201).json(newResource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getResources = async (req, res) => {
  try {
    const {
      type,
      availability_status,
      name,
      city,
      district,
      province,
      limit = 10,
      page = 1
    } = req.query;

    // Build query object
    const query = {};

    // Add filters if they exist
    if (type) query.type = type;
    if (availability_status) query.availability_status = availability_status;
    if (name) query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    
    // Location filters
    if (city || district || province) {
      query['location.address'] = {};
      if (city) query['location.address.city'] = { $regex: city, $options: 'i' };
      if (district) query['location.address.district'] = { $regex: district, $options: 'i' };
      if (province) query['location.address.province'] = { $regex: province, $options: 'i' };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const resources = await Resource.find(query)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Resource.countDocuments(query);

    res.status(200).json({
      resources,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get resources by proximity if coordinates are provided
export const getNearbyResources = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const resources = await Resource.find({
      'location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    });

    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedResource) return res.status(404).json({ message: 'Resource not found' });
    res.status(200).json(updatedResource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);
    if (!deletedResource) return res.status(404).json({ message: 'Resource not found' });
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
