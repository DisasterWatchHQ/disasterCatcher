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
import { Expo } from 'expo-server-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
dotenv.config();

connectMongoose();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: true, // Allow all origins during development
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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

// Only start the server if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
