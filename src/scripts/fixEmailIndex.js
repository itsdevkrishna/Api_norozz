import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Norozz';

async function fixEmailIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Unset email for all users where email is empty string ""
    const updateResult = await usersCollection.updateMany(
      { email: "" },
      { $unset: { email: "" } }
    );
    console.log(`Unset empty email on ${updateResult.modifiedCount} documents.`);

    // 2. Drop legacy email_1 index if present
    try {
      await usersCollection.dropIndex('email_1');
      console.log('Dropped legacy email_1 index.');
    } catch (e) {
      console.log('No legacy email_1 index to drop or already dropped:', e.message);
    }

    console.log('Email index cleanup completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during index cleanup:', err);
    process.exit(1);
  }
}

fixEmailIndex();
