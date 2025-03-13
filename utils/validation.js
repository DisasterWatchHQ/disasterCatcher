import Joi from "joi";

export const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  type: Joi.string().valid("user", "admin").default("user"),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const warningSchema = Joi.object({
  title: Joi.string().required(),
  disaster_category: Joi.string()
    .valid("flood", "fire", "earthquake", "landslide", "cyclone")
    .required(),
  description: Joi.string().required(),
  affected_locations: Joi.array()
    .items(
      Joi.object({
        address: Joi.object({
          city: Joi.string().required(),
          district: Joi.string().required(),
          province: Joi.string().required(),
        }).required(),
      })
    )
    .required(),
  severity: Joi.string().valid("low", "medium", "high", "critical").required(),
  images: Joi.array().items(Joi.string().uri()),
});

export const feedbackSchema = Joi.object({
  feedback_type: Joi.string().required(),
  message: Joi.string().required(),
});

export const userReportSchema = Joi.object({
  title: Joi.string().required(),
  disaster_category: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.object({
    address: Joi.object({
      city: Joi.string().required(),
      district: Joi.string().required(),
      province: Joi.string().required(),
    }).required(),
  }).required(),
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);

      return res.status(400).json({
        status: "fail",
        message: "Validation Error",
        errors: errorMessages,
      });
    }

    next();
  };
};

export function validateEnv() {
  const requiredEnvVars = ["PORT", "MONGODB_URI", "SESSION_SECRET", "JWT_SECRET", "NODE_ENV"];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  }

  const validEnvironments = ["development", "production", "test"];

  if (!validEnvironments.includes(process.env.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${process.env.NODE_ENV}. Must be one of: ${validEnvironments.join(", ")}`
    );
  }

  const port = parseInt(process.env.PORT, 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error("Invalid MONGODB_URI format");
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long");
  }
}
