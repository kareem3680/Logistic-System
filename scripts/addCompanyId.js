import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

const MONGO_URI = process.env.MONGO_URI;

const COMPANY_ID = new mongoose.Types.ObjectId("");

const excludedCollections = ["companies", "jobapplications", "counters"];

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("DB connected ✅");

  const collections = await mongoose.connection.db.listCollections().toArray();

  for (const col of collections) {
    const collectionName = col.name;

    if (excludedCollections.includes(collectionName)) {
      console.log(`⏭ Skipped: ${collectionName}`);
      continue;
    }

    const collection = mongoose.connection.db.collection(collectionName);

    const result = await collection.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: COMPANY_ID } },
    );

    console.log(`✔ ${collectionName} -> updated: ${result.modifiedCount}`);
  }

  console.log("Migration finished 🚀");
  process.exit();
};

run();

// Usage: node scripts/addCompanyId.js
