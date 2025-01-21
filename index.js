import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectMongoose } from "./utils/index.js";
import { errorHandler, routeNotFound } from "./middlewares/errorMiddleware.js";
import routes from "./routes/index.js";
import Scheduler from "./utils/scheduler.js";
import DevScheduler from "./utils/devScheduler.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
dotenv.config();

connectMongoose();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  Scheduler.initScheduledJobs();
  console.log("Scheduled jobs initialized");
}

if (process.env.NODE_ENV === "development") {
  app.post("/api/dev/trigger-weather-update", async (req, res) => {
    try {
      await DevScheduler.runWeatherUpdate();
      res.json({ message: "Weather update triggered successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use("/api/uploads", express.static("uploads"));
app.use("/api", routes);

app.use(routeNotFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== "dev") {
  app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
  });
}

export default app;
