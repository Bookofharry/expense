const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const User = require("../models/User");
const Income = require("../models/Income");
const BudgetDemand = require("../models/BudgetDemand");

dotenv.config({ path: path.join(__dirname, "../.env") });

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB cluster.");

    console.log("Clearing Users collection...");
    await User.deleteMany({});
    
    console.log("Clearing Income collection...");
    await Income.deleteMany({});
    
    console.log("Clearing BudgetDemands collection...");
    await BudgetDemand.deleteMany({});

    console.log("✅ Database successfully wiped clean!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
};

clearDB();
