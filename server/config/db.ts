import mongoose from "mongoose";
import { env } from "./env";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  mongoose.set("strictQuery", true);

  if (mongoose.connection.readyState === 1) return;

  connectionPromise ??= mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10000
  });

  await connectionPromise;
}
