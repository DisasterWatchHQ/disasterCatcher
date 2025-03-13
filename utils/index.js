import mongoose from "mongoose";
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import logger from "./logger.js";

dotenv.config();

export const connectMongoose = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverApi: ServerApiVersion.v1,
    });

    console.log(`MongoDB Connected: ${connection.connection.host}`);

    // Error handling
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// In a case of above not working please use the below code
// For native mongodb client
// export const getMongoClient = async () => {
//   const uri = process.env.MONGODB_URI;

//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     serverApi: {
//       version: ServerApiVersion.v1,
//       strict: true,
//       deprecationErrors: true,
//     }
//   });

//   try {
//     await client.connect();
//     console.log("Successfully connected to MongoDB!");
//     return client;
//   } catch (error) {
//     console.error("MongoDB connection error:", error);
//     throw error;
//   }
// };
//

export const createJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};
