import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import gridfsStream from "gridfs-stream";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import { MongoClient, ServerApiVersion } from "mongodb";    

dotenv.config()

export const connectMongoose = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });

    console.log(`MongoDB Connected: ${connection.connection.host}`);

    // Error handling
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};