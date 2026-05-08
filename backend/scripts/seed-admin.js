const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const User = require("../models/User");

dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB cluster.");

    const existingAdmin = await User.findOne({ email: "1harrydev@gmail.com" });
    if (existingAdmin) {
      console.log("Admin already exists. Wiping to re-seed...");
      await User.deleteOne({ email: "1harrydev@gmail.com" });
    }

    const admin = await User.create({
      name: "Harry",
      email: "1harrydev@gmail.com",
      password: "Inogofall247",
      role: "Admin",
    });

    console.log(`✅ Admin seeded successfully!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
