import WeatherData from "../models/weatherData.js";
import { WeatherService } from "./weatherService.js";

class DevScheduler {
  static async runWeatherUpdate() {
    console.log("Running manual weather update:", new Date().toISOString());

    try {
      const locations = await WeatherData.distinct("location.coordinates");

      for (const coordinates of locations) {
        try {
          const weatherData = await WeatherService.fetchWeatherData(
            coordinates[1],
            coordinates[0],
          );

          await WeatherData.findOneAndUpdate(
            {
              "location.coordinates": coordinates,
            },
            weatherData,
            { upsert: true, new: true },
          );

          console.log(`Updated weather data for location: ${coordinates}`);
        } catch (error) {
          console.error(
            `Error updating weather for location ${coordinates}:`,
            error,
          );
        }
      }

      console.log("Weather update completed successfully");
    } catch (error) {
      console.error("Error in weather update:", error);
    }
  }
}

export default DevScheduler;
