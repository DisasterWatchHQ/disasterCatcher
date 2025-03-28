import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectMongoose } from "./utils/index.js";
import { errorHandler, routeNotFound } from "./middlewares/errorMiddleware.js";
import routes from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Expo } from "expo-server-sdk";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import logger, { stream } from "./utils/logger.js";

// Load environment variables first
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

connectMongoose();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cookieParser());

const allowedOrigins = ["https://disasterwatch.vercel.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: "https://disasterwatch.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     credentials: true,
//   })
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("combined", { stream }));

// Add root route for health checks
app.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "Server is running" });
});

app.use("/api/uploads", express.static("uploads"));
app.use("/api", routes);

app.use(routeNotFound);
app.use(errorHandler);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
