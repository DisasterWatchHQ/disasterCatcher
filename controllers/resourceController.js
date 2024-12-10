import Resource from '../models/resources.js';
import { createSystemLog } from './adminLogsController.js';

export const createResource = async (req, res) => {
  try {
    const { name, type, location, contact, availability_status } = req.body;
    
    //get location data
    let locationData = {
      type: location.type
    };

    //check location type
    if (location.type === 'point') {
      locationData.coordinates = [
        parseFloat(location.longitude),
        parseFloat(location.latitude)
      ];
    }

    //if locationdata type = address -> set it in sub schema
    if (location.address) {
      locationData.address = {
        formatted_address: location.address.formatted_address,
        city: location.address.city,
        district: location.address.district,
        province: location.address.province,
        details: location.address.details
      };
    }

    //create new resource
    const resource = new Resource({
      name,
      type,
      location: locationData,
      contact,
      availability_status
    });

    //save to database
    const savedResource = await resource.save();

    //send response
    res.status(201).json({
      success: true,
      data: savedResource
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getResources = async (req, res) => {
  try {
    //query params
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

    const query = {};

    if (type) query.type = type;
    if (availability_status) query.availability_status = availability_status;
    if (name) query.name = { $regex: name, $options: 'i' };
    
    //check address
    if (city || district || province) {
      if (city) query['location.address.city'] = { $regex: city, $options: 'i' };
      if (district) query['location.address.district'] = { $regex: district, $options: 'i' };
      if (province) query['location.address.province'] = { $regex: province, $options: 'i' };
    }

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

export const getNearbyResources = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const resources = await Resource.find({
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(maxDistance)
        }
      }
    });

    res.status(200).json(resources);
  } catch (error) {
    console.error('Geospatial query error:', error);
    res.status(500).json({ error: error.message });
  }
};

//helper function to calculate distance between two points
//worked when i tried, need testing
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // distance km
}

function toRad(degrees) {
  return degrees * (Math.PI/180);
}

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
    
    await createSystemLog(
      req.user.id,
      'UPDATE_RESOURCE',
      'resource',
      updatedResource._id,
      {
        previous_state: originalResource.toObject(),
        new_state: updatedResource.toObject(),
        message: `Resource ${updatedResource.name} was updated`
      }
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
    await createSystemLog(
      req.user.id,
      'DELETE_RESOURCE',
      'resource',
      deletedResource._id,
      {
        previous_state: deletedResource.toObject(),
        message: `Resource ${deletedResource.name} was deleted`
      }
    );
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
