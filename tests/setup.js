import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index.js";

let mongoServer;
let server;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error("Failed to start MongoDB Memory Server:", error);
    // Fallback to local MongoDB if memory server fails
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/disaster-catcher-test",
    );
  }

  // Start server on a random available port
  server = app.listen(0);
  app.set("port", server.address().port);
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

export default app;
