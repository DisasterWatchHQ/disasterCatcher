import cron from "node-cron";
import WeatherData from "../models/weatherData.js";
import { WeatherService } from "./weatherService.js";

class Scheduler {
  // Initialize all scheduled tasks
  static initScheduledJobs() {
    this.scheduleWeatherUpdates();
    // Add other scheduled tasks here
  }

  // Schedule weather data updates
  static scheduleWeatherUpdates() {
    // Run every 2 hours
    // Cron format: minute hour day month day-of-week
    cron.schedule("0 */2 * * *", async () => {
      console.log(
        "Running scheduled weather update:",
        new Date().toISOString(),
      );

      try {
        // Get all unique locations from database
        const locations = await WeatherData.distinct("location.coordinates");

        for (const coordinates of locations) {
          try {
            const weatherData = await WeatherService.fetchWeatherData(
              coordinates[1], // latitude
              coordinates[0], // longitude
            );

            // Update or create weather data
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
        console.error("Error in weather update scheduler:", error);
      }
    });
  }

  // Example of another scheduled task
  static scheduleDataCleanup() {
    // Run at 00:00 every day
    cron.schedule("0 0 * * *", async () => {
      console.log("Running daily data cleanup:", new Date().toISOString());

      try {
        // Delete weather data older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await WeatherData.deleteMany({
          last_updated: { $lt: sevenDaysAgo },
        });

        console.log("Data cleanup completed successfully");
      } catch (error) {
        console.error("Error in data cleanup scheduler:", error);
      }
    });
  }
}

export default Scheduler;
