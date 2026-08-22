import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/user.model.js';
import { ROLES } from './constants/roles.constant.js';
import { seedCatalogData } from './seedCatalog.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing. Aborting seed.');
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Super Admin
    const superAdminEmail = 'superadmin@norozz.com';
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Super Admin',
        email: superAdminEmail,
        password: 'SuperAdminPass123!',
        role: ROLES.SUPER_ADMIN,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log('✅ Super Admin created: superadmin@norozz.com / SuperAdminPass123!');
    } else {
      superAdmin.password = 'SuperAdminPass123!';
      await superAdmin.save();
      console.log('✅ Super Admin password updated to: SuperAdminPass123!');
    }


    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
