import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
    }),
  ],
});

export const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export const logError = (message, meta = {}) => {
  logger.error(message, meta);
};

export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export default logger;
