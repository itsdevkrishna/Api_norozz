import { connectDB } from '../config/db.js';

export const initDatabase = async () => {
  return await connectDB();
};
