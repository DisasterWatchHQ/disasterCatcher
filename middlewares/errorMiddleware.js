import pkg from "mongoose";
import jwtPkg from "jsonwebtoken";

const { ValidationError: MongooseValidationError } = pkg;
const { JsonWebTokenError, TokenExpiredError } = jwtPkg;

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.error({
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
  });

  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token",
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      status: "fail",
      message: "Token expired",
    });
  }

  if (err instanceof MongooseValidationError) {
    const errors = Object.values(err.errors).map((el) => el.message);

    return res.status(400).json({
      status: "fail",
      message: "Validation Error",
      errors,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];

    return res.status(400).json({
      status: "fail",
      message: `Duplicate field value: ${field}. Please use another value.`,
    });
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(404).json({
      status: "fail",
      message: "Invalid ID format",
    });
  }

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};

export const routeNotFound = (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
};
