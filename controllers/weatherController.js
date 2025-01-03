import WeatherData from "../models/weatherData.js";
import { WeatherService } from "../utils/weatherService.js";
import { createSystemLog } from "./adminLogsController.js";

export const getCurrentLocationWeather = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    // Check if we have recent data (less than 2 hours old)
    const recentData = await WeatherData.findOne({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 1000, // 1km radius
        },
      },
      last_updated: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    });

    if (recentData) {
      return res.status(200).json(recentData);
    }

    // Fetch new data from OpenWeather API
    const weatherData = await WeatherService.fetchWeatherData(
      latitude,
      longitude,
    );
    const savedData = await WeatherData.create(weatherData);

    res.status(200).json(savedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSavedLocationWeather = async (req, res) => {
  try {
    const { locationId } = req.params;
    const savedLocation = await SavedLocation.findOne({
      user_id: req.user.id,
      "locations._id": locationId,
    });

    if (!savedLocation) {
      return res.status(404).json({ message: "Saved location not found" });
    }

    const location = savedLocation.locations.id(locationId);
    const weather = await getCurrentLocationWeather(
      {
        query: {
          latitude: location.coordinates[1],
          longitude: location.coordinates[0],
        },
      },
      res,
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveLocation = async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;

    const savedLocation = await SavedLocation.findOneAndUpdate(
      { user_id: req.user.id },
      {
        $push: {
          locations: {
            name,
            coordinates: [longitude, latitude],
          },
        },
      },
      { new: true, upsert: true },
    );

    res.status(200).json(savedLocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
