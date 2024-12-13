import WeatherData from '../models/weatherData.js';
import { WeatherService } from '../utils/weatherService.js';
import { createSystemLog } from './adminLogsController.js';

export const getCurrentLocationWeather = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

export const getWeatherData = async (req, res) => {
  try {
    const weatherData = await WeatherData.find();
    res.status(200).json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWeatherDataById = async (req, res) => {
  try {
    const weatherData = await WeatherData.findById(req.params.id);
    if (!weatherData) return res.status(404).json({ message: 'Weather Data not found' });
    res.status(200).json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWeatherData = async (req, res) => {
  try {
    const updatedWeatherData = await WeatherData.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedWeatherData) return res.status(404).json({ message: 'Weather Data not found' });
    res.status(200).json(updatedWeatherData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWeatherData = async (req, res) => {
  try {
    const deletedWeatherData = await WeatherData.findByIdAndDelete(req.params.id);
    if (!deletedWeatherData) return res.status(404).json({ message: 'Weather Data not found' });
    res.status(200).json({ message: 'Weather Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
