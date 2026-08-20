import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Category } from '../models/category.model.js';
import { Skill } from '../models/skill.model.js';

const DEFAULT_CATEGORY_SKILLS = {
  'AC & Appliance Repair': [
    'Split AC Installation & Uninstallation',
    'Gas Leakage Repair & Refilling',
    'Deep Jet Cleaning & Servicing',
    'Inverter AC PCB Board Repair',
    'Compressor Replacement',
    'Window & Tower AC Repair'
  ],
  'Cleaning & Pest Control': [
    'Full Home Deep Cleaning',
    'Bathroom Sanitization & Tile Scrubbing',
    'Cockroach & Pest Gel Treatment',
    'Sofa & Mattress Foam Shampooing',
    'Kitchen Degreasing & Chimney Clean',
    'Water Tank & Balcony Washing'
  ],
  'Plumbing, Electrical & Carpentry': [
    'Pipe Fitting & Leakage Repair',
    'RO Purifier Filter Service & Install',
    'Switchboard Wiring & MCB Fix',
    'Fan, Light & Chandelier Mount',
    'Door Lock & Cabinet Fitting',
    'Geyser & Water Heater Repair'
  ],
  'Salon & Beauty for Women': [
    'O3+ Facial & De-Tan Cleanup',
    'Rica & Roll-on Body Waxing',
    'Pedicure & Manicure Spa',
    'Hair Spa & Keratin Treatment',
    'Bridal & Party Makeup',
    'Eyebrow & Upper Lip Threading'
  ],
  "Men's Salon & Grooming": [
    'Fade & Modern Haircut',
    'Beard Styling & Trimming',
    'Hot Towel Charcoal Shave',
    'Head & Shoulder Massage',
    'Hair Color & Ammonia-Free Dye',
    'Face Scrub & Anti-Acne Facial'
  ],
  'Home Painting & Decor': [
    'Accent Wall & Texture Painting',
    'Wall Waterproofing & Seepage Repair',
    'Damp Treatment & Anti-Fungal Coating',
    'POP & Gypsum False Ceiling Work',
    'Royal Emulsion Smooth Finish',
    'Wood & Furniture Polish'
  ],
  'Washing Machine & Refrigerator': [
    'Washing Machine Drum & Motor Repair',
    'Refrigerator Gas Charge & Cooling Fix',
    'Front & Top Load Maintenance',
    'Thermostat & Sensor Replacement',
    'Drainage Pipe Leakage Repair',
    'Inverter Compressor Diagnostics'
  ]
};

const seedSkills = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting Dedicated Skill Collection Seeding Process...');

    const categories = await Category.find({ status: { $ne: 'deleted' } });
    console.log(`Found ${categories.length} existing categories in DB.`);

    let totalCreated = 0;

    for (const cat of categories) {
      let skillsToSeed = [];
      const matchedKey = Object.keys(DEFAULT_CATEGORY_SKILLS).find(
        (key) => cat.name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cat.name.toLowerCase())
      );

      if (matchedKey) {
        skillsToSeed = DEFAULT_CATEGORY_SKILLS[matchedKey];
      } else {
        skillsToSeed = [
          `${cat.name} Standard Repair & Service`,
          `${cat.name} Installation & Setup`,
          `${cat.name} Component Inspection & Testing`,
          `${cat.name} Maintenance & Cleaning`,
          `${cat.name} Troubleshooting & Diagnostics`,
          `${cat.name} Emergency Repair & Replacement`
        ];
      }

      for (const skillName of skillsToSeed) {
        const existing = await Skill.findOne({
          category: cat._id,
          name: skillName,
        });

        if (!existing) {
          await Skill.create({
            name: skillName,
            category: cat._id,
            description: `Professional ${skillName} services for ${cat.name}`,
            status: 'active',
          });
          totalCreated++;
        }
      }

      console.log(`✅ Seeded skills for Category: '${cat.name}'`);
    }

    console.log(`\n🎉 Successfully seeded ${totalCreated} dedicated Skill documents linked to Categories!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding skills collection:', err);
    process.exit(1);
  }
};

seedSkills();
