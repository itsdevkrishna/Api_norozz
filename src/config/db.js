import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance
 */
export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 3000, // 3s timeout for local dev
    });
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message} (Running in Offline/Mock DB Mode)`);
  }
};
