import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/norozz',
      {
        autoIndex: true,
        serverSelectionTimeoutMS: 3000, // 3s timeout for local dev
      }
    );
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message} (Running in Offline/Mock DB Mode)`);
  }
};
