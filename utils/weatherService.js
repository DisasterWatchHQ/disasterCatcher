import axios from 'axios';
import WeatherData from '../models/weatherData.js';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class WeatherService {
  static async fetchWeatherData(lat, lon) {
    try {
      // Get current weather
      const currentWeather = await axios.get(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      // Get forecast
      const forecast = await axios.get(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      // Get alerts if available
      const oneCall = await axios.get(
        `${BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      return this.formatWeatherData(currentWeather.data, forecast.data, oneCall.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  static formatWeatherData(current, forecast, oneCall) {
    return {
      location: {
        type: 'Point',
        coordinates: [current.coord.lon, current.coord.lat],
        name: current.name,
        city: current.name,
        country: current.sys.country
      },
      current_weather: {
        temperature: current.main.temp,
        feels_like: current.main.feels_like,
        humidity: current.main.humidity,
        wind_speed: current.wind.speed,
        wind_direction: current.wind.deg,
        description: current.weather[0].description,
        icon: current.weather[0].icon
      },
      forecast: forecast.list.map(item => ({
        date: new Date(item.dt * 1000),
        temperature_max: item.main.temp_max,
        temperature_min: item.main.temp_min,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        precipitation_probability: item.pop
      })),
      alerts: oneCall.alerts ? oneCall.alerts.map(alert => ({
        type: alert.event,
        severity: this.determineAlertSeverity(alert),
        description: alert.description,
        start_time: new Date(alert.start * 1000),
        end_time: new Date(alert.end * 1000)
      })) : [],
      last_updated: new Date()
    };
  }

  static determineAlertSeverity(alert) {
    // Implement logic to determine severity based on alert type
    return 'medium';
  }
}