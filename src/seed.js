import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/user.model.js';
import { ROLES } from './constants/roles.constant.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://krishanji:krishanji@krishanji.b2r9i.mongodb.net/norozz?retryWrites=true&w=majority';

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

    // 2. City Admin (Delhi NCR)
    const cityAdminEmail = 'delhi.admin@norozz.com';
    let cityAdmin = await User.findOne({ email: cityAdminEmail });
    if (!cityAdmin) {
      cityAdmin = await User.create({
        name: 'Delhi Operations Manager',
        email: cityAdminEmail,
        password: 'CityAdminPass123!',
        role: ROLES.CITY_ADMIN,
        assignedCity: 'Delhi NCR',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log('✅ City Admin created: delhi.admin@norozz.com / CityAdminPass123!');
    } else {
      cityAdmin.password = 'CityAdminPass123!';
      await cityAdmin.save();
      console.log('✅ City Admin password updated to: CityAdminPass123!');
    }

    // 3. Partner (Approved)
    const partnerEmail = 'suresh.partner@norozz.com';
    let partner = await User.findOne({ email: partnerEmail });
    if (!partner) {
      partner = await User.create({
        name: 'Suresh Kumar',
        agencyName: 'CleanPro Services',
        email: partnerEmail,
        password: 'PartnerPass123!',
        role: ROLES.PARTNER,
        assignedCity: 'Delhi NCR',
        kycStatus: 'approved',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log('✅ Partner created: suresh.partner@norozz.com / PartnerPass123!');
    } else {
      partner.password = 'PartnerPass123!';
      await partner.save();
      console.log('✅ Partner password updated to: PartnerPass123!');
    }

    // 4. Customer
    const customerEmail = 'ananya.test@norozz.com';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = await User.create({
        name: 'Ananya Deshmukh',
        email: customerEmail,
        password: 'NewCustomerPass123!',
        role: ROLES.CUSTOMER,
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log('✅ Customer created: ananya.test@norozz.com / NewCustomerPass123!');
    } else {
      customer.password = 'NewCustomerPass123!';
      await customer.save();
      console.log('✅ Customer password updated to: NewCustomerPass123!');
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
