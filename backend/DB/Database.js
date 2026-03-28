import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    mongoose.connection.on("error", (error) => {
      console.error(`[mongo] Runtime error: ${error.message}`);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[mongo] Disconnected");
    });
    console.log(`[mongo] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[mongo] Connection failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;
